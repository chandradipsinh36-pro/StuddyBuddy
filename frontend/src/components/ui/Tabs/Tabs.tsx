import React, { useState } from 'react';
import styles from './Tabs.module.css';

interface Tab {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  variant?: 'line' | 'pill';
}

export function Tabs({ tabs, defaultTab, onChange, variant = 'line' }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.tabList} ${styles[variant]}`} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            className={`${styles.tab} ${active === tab.id ? styles.active : ''}`}
            onClick={() => handleChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map(tab => (
        tab.content && active === tab.id && (
          <div key={tab.id} role="tabpanel" className={styles.panel}>
            {tab.content}
          </div>
        )
      ))}
    </div>
  );
}
