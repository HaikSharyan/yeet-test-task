import type { ReactNode } from 'react';

interface StatItemProps {
    label: string;
    children: ReactNode;
}

export function StatItem({ label, children }: StatItemProps) {
    return (
        <div className="stat-item">
            <span className="stat-item__label">{label}</span>
            <div className="stat-item__value">{children}</div>
        </div>
    );
}