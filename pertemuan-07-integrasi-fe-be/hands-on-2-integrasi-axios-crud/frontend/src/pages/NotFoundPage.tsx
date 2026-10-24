import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui.tsx';
import { buttonClass } from '../lib/buttonClass.ts';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Halaman tidak ditemukan"
      message="Halaman yang kamu cari tidak tersedia atau sudah dipindahkan."
      action={
        <Link to="/" className={buttonClass('secondary')}>
          Kembali ke Beranda
        </Link>
      }
    />
  );
}
