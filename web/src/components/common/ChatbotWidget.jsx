import { useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../../services/axiosClient';

const initialBotMessage = {
	role: 'bot',
	text: 'Hello. I am Roomerang\'s basic chatbot assistant. You can ask about website information or available hotels.',
	suggestions: ['Hotel list', 'Website information', 'How to book a room'],
};

const ChatbotWidget = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState('');
	const [sending, setSending] = useState(false);
	const [messages, setMessages] = useState([initialBotMessage]);
	const messagesEndRef = useRef(null);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, isOpen]);

	const latestSuggestions = useMemo(() => {
		for (let i = messages.length - 1; i >= 0; i -= 1) {
			if (messages[i].role === 'bot' && Array.isArray(messages[i].suggestions)) {
				return messages[i].suggestions;
			}
		}

		return [];
	}, [messages]);

	const sendMessage = async (presetText) => {
		const text = String(presetText ?? input).trim();
		if (!text || sending) {
			return;
		}

		setMessages((prev) => [...prev, { role: 'user', text }]);
		setInput('');
		setSending(true);

		try {
			const response = await axiosClient.post('/chatbot/ask', { message: text });
			const reply =
				response?.data?.reply ||
				'I received your question, but I do not have enough information to answer yet.';
			const suggestions = Array.isArray(response?.data?.suggestions)
				? response.data.suggestions
				: [];

			setMessages((prev) => [...prev, { role: 'bot', text: reply, suggestions }]);
		} catch (error) {
			setMessages((prev) => [
				...prev,
				{
					role: 'bot',
					text: 'Sorry, the chatbot is currently busy. Please try again in a moment.',
					suggestions: ['Hotel list', 'Website information'],
				},
			]);
		} finally {
			setSending(false);
		}
	};

	return (
		<>
			<div className="fixed bottom-5 right-5 z-[120]">
				<button
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					className="group flex items-center gap-3 rounded-sm border border-gray-900 bg-white px-3 py-2.5 shadow-[0_14px_30px_rgba(17,24,39,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(17,24,39,0.2)]"
					aria-expanded={isOpen}
					aria-label={isOpen ? 'Close Roomerang assistant' : 'Open Roomerang assistant'}
				>
					<div className="flex h-9 w-9 items-center justify-center border border-gray-900 rounded-sm bg-gray-900 text-white">
						<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M4 4h16v11H7.5L4 18.5V4zm2 2v7.67L6.67 13H18V6H6zm2.5 2h7v2h-7V8zm0 3h5v2h-5v-2z" />
						</svg>
					</div>
					<div className="text-left hidden sm:block">
						<p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 leading-none">Roomerang</p>
						<p className="text-xs uppercase tracking-widest text-gray-900 mt-1 leading-none">
							{isOpen ? 'Hide Assistant' : 'Ask Assistant'}
						</p>
					</div>
				</button>
			</div>

			{isOpen && (
				<div className="fixed bottom-24 right-5 z-[120] w-[calc(100vw-2.5rem)] max-w-[24rem] rounded-sm border border-gray-200 bg-[#FFFCFA] shadow-[0_24px_55px_rgba(17,24,39,0.2)] overflow-hidden animate-slide-up">
					<div className="px-4 py-3.5 border-b border-gray-200 bg-gradient-to-r from-white via-white to-orange-50/60 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-9 w-9 border border-gray-900 rounded-sm bg-gray-900 text-white flex items-center justify-center">
								<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
								</svg>
							</div>
							<div>
								<p className="text-[10px] uppercase tracking-[0.2em] text-orange-800 font-medium">Virtual Concierge</p>
								<p className="text-xs uppercase tracking-widest text-gray-900 mt-0.5">Roomerang Assistant</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900"
						>
							Close
						</button>
					</div>

					<div className="h-[22rem] overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white to-[#FFFCFA] hide-scrollbar">
						{messages.map((message, index) => (
							<div
								key={`${message.role}-${index}`}
								className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`max-w-[85%] px-3.5 py-2.5 rounded-sm text-sm leading-relaxed shadow-sm ${
										message.role === 'user'
											? 'bg-gray-900 text-white'
											: 'bg-white border border-gray-200 text-gray-700'
									}`}
								>
									{message.text}
								</div>
							</div>
						))}

						{sending && (
							<div className="flex justify-start">
								<div className="max-w-[85%] px-3.5 py-2.5 rounded-sm text-sm bg-white border border-gray-200 text-gray-500">
									Assistant is thinking...
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{latestSuggestions.length > 0 && !sending && (
						<div className="px-4 pb-3 pt-3 flex flex-wrap gap-2 border-t border-gray-200 bg-white/80">
							{latestSuggestions.slice(0, 3).map((suggestion) => (
								<button
									key={suggestion}
									type="button"
									onClick={() => sendMessage(suggestion)}
									className="px-2.5 py-1.5 text-[10px] uppercase tracking-widest border border-gray-300 rounded-sm text-gray-600 hover:text-orange-800 hover:border-orange-800 transition-colors"
								>
									{suggestion}
								</button>
							))}
						</div>
					)}

					<form
						onSubmit={(event) => {
							event.preventDefault();
							sendMessage();
						}}
						className="p-3 border-t border-gray-200 bg-[#FFFCFA] flex gap-2"
					>
						<input
							type="text"
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="Ask about hotels or website..."
							className="flex-1 border border-gray-300 bg-white rounded-sm px-3 py-2 text-sm focus:ring-0 focus:border-orange-800"
							disabled={sending}
						/>
						<button
							type="submit"
							disabled={sending || !input.trim()}
							className="px-4 py-2 bg-orange-800 text-white text-xs uppercase tracking-widest rounded-sm hover:bg-orange-900 disabled:opacity-50 transition-colors"
						>
							Send
						</button>
					</form>
				</div>
			)}
		</>
	);
};

export default ChatbotWidget;
