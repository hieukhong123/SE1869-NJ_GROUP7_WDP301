import { catchAsync } from '../middlewares/errorMiddleware.js';
import Hotel from '../models/Hotel.js';
import { HttpStatus } from '../utils/httpStatus.js';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GOOGLE_AI_MODEL = process.env.GOOGLE_AI_MODEL || 'gemini-flash-latest';
const GOOGLE_AI_API_URL =
	process.env.GOOGLE_AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';

// const CHATBOT_MODEL = process.env.CHATBOT_MODEL || 'gpt-4o-mini';
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
// const OPENAI_API_URL =
// 	process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

const stripAccents = (value = '') =>
	String(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value = '') =>
	stripAccents(value)
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const truncate = (value = '', maxLength = 180) => {
	if (!value || value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength).trim()}...`;
};

const buildHotelListReply = (hotels) => {
	if (!hotels.length) {
		return 'There are currently no active hotels available on the website. Please try again later.';
	}

	const lines = hotels.slice(0, 5).map((hotel) => `- ${hotel.name} (${hotel.city})`);
	return `Here are some currently active hotels:\n${lines.join('\n')}\nYou can ask for a specific hotel name to get basic information.`;
};

const buildHotelDetailReply = (hotel) => {
	const detailParts = [
		`${hotel.name} is a ${hotel.propertyType || 'hotel'} in ${hotel.city}.`,
	];

	if (hotel.address) {
		detailParts.push(`Address: ${hotel.address}.`);
	}

	if (hotel.description) {
		detailParts.push(`Description: ${truncate(hotel.description)}.`);
	}

	return detailParts.join(' ');
};

const getDefaultSuggestions = () => [
	'Hotel list',
	'How to book a room',
	'Website information',
];

const getWebsiteFacts = () => [
	'Roomerang is a hotel booking website.',
	'Users can browse hotels, view room options, place bookings, and pay online.',
	'SePay is supported for online payment.',
	'Users can submit support requests from the Contact page.',
];

const buildHotelsKnowledge = (hotels) => {
	if (!Array.isArray(hotels) || hotels.length === 0) {
		return 'No active hotel records are available right now.';
	}

	return hotels
		.slice(0, 20)
		.map((hotel, index) => {
			const description = hotel.description
				? ` Description: ${truncate(hotel.description, 140)}.`
				: '';

			return `${index + 1}. Name: ${hotel.name}. City: ${hotel.city}. Type: ${hotel.propertyType || 'Hotel'}. Address: ${hotel.address || 'N/A'}.${description}`;
		})
		.join('\n');
};

const buildSystemPrompt = () => `You are the Roomerang website assistant.
Follow these rules:
- Answer in clear, simple English.
- Only answer basic questions about Roomerang website and hotels.
- Use only the provided knowledge context.
- If user asks unrelated or overly detailed questions, politely say you can only support basic hotel and website information.
- Do not invent unavailable details (prices, availability, policies, or contacts) unless present in context.
- Keep replies concise (2-6 sentences).`;

const callGoogleAiChatbot = async ({ userMessage, hotels }) => {
	if (!GOOGLE_AI_API_KEY) {
		return null;
	}

	const contextBlock = [
		'Website facts:',
		...getWebsiteFacts().map((fact) => `- ${fact}`),
		'',
		'Active hotels context:',
		buildHotelsKnowledge(hotels),
	].join('\n');

	const body = {
		systemInstruction: {
			parts: [{ text: buildSystemPrompt() }],
		},
		contents: [
			{
				role: 'user',
				parts: [
					{
						text: `Context:\n${contextBlock}\n\nUser question: ${userMessage}`,
					},
				],
			},
		],
		generationConfig: {
			temperature: 0.2,
			maxOutputTokens: 500,
		},
	};

	const response = await fetch(
		`${GOOGLE_AI_API_URL}/${encodeURIComponent(GOOGLE_AI_MODEL)}:generateContent?key=${GOOGLE_AI_API_KEY}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		},
	);

	if (!response.ok) {
		const errorPayload = await response.text();
		throw new Error(`Google AI provider error: ${response.status} ${errorPayload}`);
	}

	const payload = await response.json();
	const parts = payload?.candidates?.[0]?.content?.parts || [];
	const aiReply = parts
		.map((part) => part?.text)
		.filter(Boolean)
		.join('\n')
		.trim();

	if (!aiReply) {
		return null;
	}

	return {
		reply: aiReply,
		suggestions: getDefaultSuggestions(),
	};
};

const callOpenAiChatbot = async ({ userMessage, hotels }) => {
	if (!OPENAI_API_KEY) {
		return null;
	}

	const contextBlock = [
		'Website facts:',
		...getWebsiteFacts().map((fact) => `- ${fact}`),
		'',
		'Active hotels context:',
		buildHotelsKnowledge(hotels),
	].join('\n');

	const body = {
		model: CHATBOT_MODEL,
		temperature: 0.2,
		messages: [
			{ role: 'system', content: buildSystemPrompt() },
			{
				role: 'user',
				content: `Context:\n${contextBlock}\n\nUser question: ${userMessage}`,
			},
		],
	};

	const response = await fetch(OPENAI_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorPayload = await response.text();
		throw new Error(`AI provider error: ${response.status} ${errorPayload}`);
	}

	const payload = await response.json();
	const aiReply = payload?.choices?.[0]?.message?.content?.trim();

	if (!aiReply) {
		return null;
	}

	return {
		reply: aiReply,
		suggestions: getDefaultSuggestions(),
	};
};

const getRuleBasedReply = ({ rawMessage, message, hotels }) => {
	const hotelIntentKeywords = [
		'khach san',
		'hotel',
		'resort',
		'villa',
		'property',
		'danh sach',
		'list',
		'o dau',
		'where',
		'available',
	];

	const greetingKeywords = ['xin chao', 'chao', 'hello', 'hi', 'hey'];
	const aboutKeywords = ['website', 'roomerang', 'gioi thieu', 'about'];
	const bookingKeywords = ['dat phong', 'booking', 'reservation', 'book'];
	const paymentKeywords = ['thanh toan', 'payment', 'sepay', 'vietqr'];
	const contactKeywords = ['lien he', 'contact', 'email', 'so dien thoai', 'phone'];
	const refundKeywords = ['hoan tien', 'refund', 'huy phong', 'cancel'];

	if (!rawMessage) {
		return {
			reply: 'Please enter a short question. For example: "Which hotels are available?" or "Tell me about this website."',
			suggestions: ['Hotel list', 'What is this website?', 'How to book a room'],
		};
	}

	if (includesAny(message, greetingKeywords)) {
		return {
			reply: 'Hello. I am Roomerang\'s basic chatbot assistant. I can help with general website and hotel information.',
			suggestions: ['Hotel list', 'How to book a room', 'Contact information'],
		};
	}

	if (includesAny(message, aboutKeywords)) {
		return {
			reply: 'Roomerang is a hotel booking website where users can search hotels, view room types, make reservations, and pay online.',
			suggestions: ['Hotel list', 'How to book a room', 'How payment works'],
		};
	}

	if (includesAny(message, bookingKeywords)) {
		return {
			reply: 'To book a room, go to the Hotels page, choose a hotel and stay dates, select a suitable room, then complete payment. After successful payment, your booking status will be updated.',
			suggestions: ['Hotel list', 'How payment works', 'Cancellation policy'],
		};
	}

	if (includesAny(message, paymentKeywords)) {
		return {
			reply: 'The website currently supports SePay for online payments. After a successful transfer, the system verifies it and updates your booking.',
			suggestions: ['How to book a room', 'Cancellation policy', 'Contact information'],
		};
	}

	if (includesAny(message, contactKeywords)) {
		return {
			reply: 'You can use the Contact page on the website to submit a support request. Our team will respond through your provided contact channel.',
			suggestions: ['Where is the Contact page?', 'Hotel list'],
		};
	}

	if (includesAny(message, refundKeywords)) {
		return {
			reply: 'For paid bookings, cancellation and refund requests are processed according to policy. The operations team will review and update the result on your booking.',
			suggestions: ['How to book a room', 'Contact information'],
		};
	}

	const needsHotelData = includesAny(message, hotelIntentKeywords);
	if (needsHotelData) {
		const matchedHotel = hotels.find((hotel) =>
			message.includes(normalizeText(hotel.name)),
		);

		if (matchedHotel) {
			return {
				reply: buildHotelDetailReply(matchedHotel),
				suggestions: ['Hotel list', 'How to book a room', 'Website information'],
			};
		}

		const cities = [...new Set(hotels.map((hotel) => normalizeText(hotel.city)))];
		const requestedCity = cities.find((city) => city && message.includes(city));

		if (requestedCity) {
			const cityHotels = hotels.filter(
				(hotel) => normalizeText(hotel.city) === requestedCity,
			);
			return {
				reply: buildHotelListReply(cityHotels),
				suggestions: ['Website information', 'How to book a room'],
			};
		}

		return {
			reply: buildHotelListReply(hotels),
			suggestions: ['Website information', 'How to book a room', 'How payment works'],
		};
	}

	return {
		reply: 'Sorry, I currently support only basic questions about Roomerang hotels and website information. Please ask about hotel list, booking, payment, or contact.',
		suggestions: ['Hotel list', 'Website information', 'How to book a room'],
	};
};

const askChatbot = catchAsync(async (req, res) => {
	const rawMessage = String(req.body?.message || '').trim();
	const safeMessage = rawMessage.slice(0, 500);
	const message = normalizeText(rawMessage);
	const hotels = await Hotel.find({ status: 'active' })
		.select('name city address propertyType description')
		.sort({ createdAt: -1 })
		.limit(50);

	if (safeMessage) {
		try {
			if (GOOGLE_AI_API_KEY) {
				const googleResult = await callGoogleAiChatbot({
					userMessage: safeMessage,
					hotels,
				});

				if (googleResult?.reply) {
					return res.status(HttpStatus.OK).json({
						success: true,
						data: googleResult,
					});
				}
			}

			if (OPENAI_API_KEY) {
				const openAiResult = await callOpenAiChatbot({
					userMessage: safeMessage,
					hotels,
				});

				if (openAiResult?.reply) {
					return res.status(HttpStatus.OK).json({
						success: true,
						data: openAiResult,
					});
				}
			}
		} catch (error) {
			console.error('[Chatbot][AI Fallback Triggered]:', error.message);
		}
	}

	const fallback = getRuleBasedReply({ rawMessage: safeMessage, message, hotels });
	return res.status(HttpStatus.OK).json({
		success: true,
		data: fallback,
	});
});

export { askChatbot };
