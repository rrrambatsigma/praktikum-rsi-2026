import express, { type Request, type Response } from 'express';

const app = express();
const PORT: number = 3000;

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: "success",
        message: "Server is running",
        timestamp: new Date()
    });
});

// Menyalakan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
