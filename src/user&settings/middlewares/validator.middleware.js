export const validateSchema = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({
        error: error.errors.map((err) => ({path: err.path, message: err.message,})),
        });
    }
};