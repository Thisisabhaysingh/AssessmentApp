export const ok = (res, data = {}, message = 'OK') => res.json({ success: true, message, data });
export const created = (res, data = {}, message = 'Created') => res.status(201).json({ success: true, message, data });
export const bad = (res, message = 'Bad Request', code = 400) => res.status(code).json({ success: false, message });
export const unauthorized = (res, message = 'Unauthorized') => res.status(401).json({ success: false, message });
export const forbidden = (res, message = 'Forbidden') => res.status(403).json({ success: false, message });
export const serverError = (res, error) => res.status(500).json({ success: false, message: 'Server Error', error: String(error) });
export const notFound = (res, error) => res.status(404).json({ success: false, message: 'Not Found', error: String(error) });
