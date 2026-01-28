import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    const languages = [
        { code: 'zh', label: '中文' },
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'es', label: 'Español' },
        { code: 'it', label: 'Italiano' },
        { code: 'sv', label: 'Svenska' },
        { code: 'da', label: 'Dansk' },
        { code: 'no', label: 'Norsk' },
        { code: 'fi', label: 'Suomi' },
        { code: 'is', label: 'Íslenska' },
        { code: 'ja', label: '日本語' },
        { code: 'ko', label: '한국어' }
    ];

    return (
        <div className="language-switcher">
            <select
                onChange={changeLanguage}
                value={i18n.language ? i18n.language.slice(0, 2) : 'zh'}
                style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)'
                }}
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} style={{ color: '#333' }}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
