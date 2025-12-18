import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Trading<span style={{ color: 'var(--primary)' }}>Journal</span>
        </Link>
        <nav className="flex gap-4">
          <Link href="/" className="text-sm text-secondary hover:text-primary">
            Dashboard
          </Link>
          {/* Add more links here later */}
        </nav>
      </div>
    </header>
  );
}
