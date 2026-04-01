const normalizeExtraPrice = (value) => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return Math.max(0, value);
	}

	if (typeof value === 'string') {
		const sanitized = value.replace(/[^0-9.-]/g, '').trim();
		if (!sanitized) {
			return 0;
		}

		const parsed = Number(sanitized);
		if (Number.isFinite(parsed)) {
			return Math.max(0, parsed);
		}
	}

	return 0;
};

export const up = async (db) => {
	const roomCollection = db.collection('roomcategories');
	const extraFeeCollection = db.collection('extrafees');

	await roomCollection.updateMany(
		{ isDeleted: { $exists: false } },
		{ $set: { isDeleted: false } },
	);

	await roomCollection.updateMany(
		{ deletedAt: { $exists: false } },
		{ $set: { deletedAt: null } },
	);

	await extraFeeCollection.updateMany(
		{ isDeleted: { $exists: false } },
		{ $set: { isDeleted: false } },
	);

	await extraFeeCollection.updateMany(
		{ deletedAt: { $exists: false } },
		{ $set: { deletedAt: null } },
	);

	const extraFeeCursor = extraFeeCollection.find({}, { projection: { extraPrice: 1 } });
	const operations = [];

	for await (const doc of extraFeeCursor) {
		const normalizedPrice = normalizeExtraPrice(doc.extraPrice);
		if (doc.extraPrice !== normalizedPrice) {
			operations.push({
				updateOne: {
					filter: { _id: doc._id },
					update: {
						$set: {
							extraPrice: normalizedPrice,
						},
					},
				},
			});
		}
	}

	if (operations.length > 0) {
		await extraFeeCollection.bulkWrite(operations, { ordered: false });
	}
};

export const down = async (db) => {
	const roomCollection = db.collection('roomcategories');
	const extraFeeCollection = db.collection('extrafees');

	await roomCollection.updateMany(
		{},
		{ $unset: { isDeleted: '', deletedAt: '' } },
	);

	await extraFeeCollection.updateMany(
		{},
		{ $unset: { isDeleted: '', deletedAt: '' } },
	);

	const extraFeeCursor = extraFeeCollection.find({}, { projection: { extraPrice: 1 } });
	const operations = [];

	for await (const doc of extraFeeCursor) {
		if (typeof doc.extraPrice === 'number') {
			operations.push({
				updateOne: {
					filter: { _id: doc._id },
					update: {
						$set: {
							extraPrice: String(doc.extraPrice),
						},
					},
				},
			});
		}
	}

	if (operations.length > 0) {
		await extraFeeCollection.bulkWrite(operations, { ordered: false });
	}
};
