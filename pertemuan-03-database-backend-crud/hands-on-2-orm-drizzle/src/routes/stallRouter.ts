import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';

const stallRouter = Router();
const stallController = new StallController();

/**
 * @openapi
 * /api/v1/stalls:
 *   get:
 *     tags: [Stalls]
 *     summary: Daftar warung (filter + pagination)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cari berdasarkan nama
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter kategori
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Daftar warung
 *   post:
 *     tags: [Stalls]
 *     summary: Buat warung baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StallInput'
 *     responses:
 *       201:
 *         description: Warung dibuat
 */
stallRouter.get('/', stallController.getStalls);
stallRouter.post('/', stallController.createStall);

/**
 * @openapi
 * /api/v1/stalls/{id}:
 *   get:
 *     tags: [Stalls]
 *     summary: Detail warung
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detail warung
 *       404:
 *         description: Tidak ditemukan
 *   put:
 *     tags: [Stalls]
 *     summary: Ubah warung
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StallInput'
 *     responses:
 *       200:
 *         description: Warung ter-update
 *       404:
 *         description: Tidak ditemukan
 *   delete:
 *     tags: [Stalls]
 *     summary: Hapus warung
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Warung terhapus
 *       404:
 *         description: Tidak ditemukan
 */
stallRouter.get('/:id', stallController.getStallById);
stallRouter.put('/:id', stallController.updateStall);
stallRouter.delete('/:id', stallController.deleteStall);

/**
 * @openapi
 * /api/v1/stalls/{id}/menus:
 *   get:
 *     tags: [Stalls]
 *     summary: Daftar menu warung
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Daftar menu
 *       404:
 *         description: Tidak ditemukan
 */
stallRouter.get('/:id/menus', stallController.getStallMenus);

export { stallRouter };
