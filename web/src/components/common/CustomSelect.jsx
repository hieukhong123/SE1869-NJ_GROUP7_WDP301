import { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';

const CustomSelect = ({ value, options = [], onChange, placeholder, label, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    return (
        <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
            {label && <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{label}</label>}
            
            {/* Thanh Select */}
            <div 
                className="relative flex items-center justify-between w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light cursor-pointer transition-colors hover:border-gray-900"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!value ? "text-gray-400" : "text-gray-900"}>{selectedLabel}</span>
                <CaretDown size={14} weight="light" className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Menu xổ xuống */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-gray-100 shadow-2xl rounded-sm py-2 max-h-60 overflow-y-auto animate-fade-in">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`px-4 py-2.5 text-sm font-light cursor-pointer transition-colors ${value === opt.value ? "text-orange-800 bg-orange-50/50" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;