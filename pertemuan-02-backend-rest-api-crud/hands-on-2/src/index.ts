import express, { type Request, type Response, type Application } from 'express';
import { stallRouter } from './routes/stallRouter.ts';

const app: Application = express();
const PORT: number = 3000;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: "success", message: "Server running" });
});

// Pendaftaran Module Router dengan URL Prefix
app.use('/api/v1/stalls', stallRouter);

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
