/**
 * ============================================
 * DATE INPUT COMPONENT
 * Custom date input with dd/mm/yyyy format
 * Validates 4-digit year
 * ============================================
 */

import { useState, useEffect } from 'react';

/**
 * DateInput component with dd/mm/yyyy format
 * @param {string} value - Date value in yyyy-mm-dd format (ISO)
 * @param {function} onChange - Callback with {target: {name, value}} in yyyy-mm-dd format
 * @param {string} name - Input name
 * @param {string} className - CSS classes
 * @param {boolean} disabled - Disabled state
 * @param {string} placeholder - Placeholder text
 * @param {string} min - Minimum date (yyyy-mm-dd)
 * @param {string} max - Maximum date (yyyy-mm-dd)
 */
export default function DateInput({
    value = '',
    onChange,
    name = '',
    className = '',
    disabled = false,
    placeholder = 'dd/mm/yyyy',
    min,
    max,
    ...props
}) {
    // Convert ISO date (yyyy-mm-dd) to display format (dd/mm/yyyy)
    const isoToDisplay = (isoDate) => {
        if (!isoDate) return '';
        const parts = isoDate.split('-');
        if (parts.length !== 3) return isoDate;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    // Convert display format (dd/mm/yyyy) to ISO (yyyy-mm-dd)
    const displayToIso = (displayDate) => {
        if (!displayDate) return '';
        // Remove any non-numeric characters except /
        const cleaned = displayDate.replace(/[^\d/]/g, '');
        const parts = cleaned.split('/');
        if (parts.length !== 3) return '';
        const [day, month, year] = parts;
        // Only return valid if year is 4 digits
        if (year && year.length === 4) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return '';
    };

    const [displayValue, setDisplayValue] = useState(isoToDisplay(value));
    const [error, setError] = useState('');

    // Sync displayValue when value prop changes
    useEffect(() => {
        setDisplayValue(isoToDisplay(value));
    }, [value]);

    // Auto-format as user types
    const handleInputChange = (e) => {
        let input = e.target.value;

        // Remove non-numeric characters except /
        let cleaned = input.replace(/[^\d/]/g, '');

        // Auto-add slashes
        if (cleaned.length === 2 && !cleaned.includes('/')) {
            cleaned += '/';
        } else if (cleaned.length === 5 && cleaned.charAt(2) === '/' && !cleaned.substring(3).includes('/')) {
            cleaned += '/';
        }

        // Limit length (dd/mm/yyyy = 10 chars)
        if (cleaned.length > 10) {
            cleaned = cleaned.substring(0, 10);
        }

        setDisplayValue(cleaned);

        // Validate and convert to ISO
        const parts = cleaned.split('/');
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);

            // Basic validation
            if (day < 1 || day > 31) {
                setError('Ngày không hợp lệ (1-31)');
                return;
            }
            if (month < 1 || month > 12) {
                setError('Tháng không hợp lệ (1-12)');
                return;
            }
            if (year < 1900 || year > 2100) {
                setError('Năm phải từ 1900 đến 2100');
                return;
            }

            // Create date and validate
            const testDate = new Date(year, month - 1, day);
            if (testDate.getDate() !== day || testDate.getMonth() !== month - 1 || testDate.getFullYear() !== year) {
                setError('Ngày không tồn tại');
                return;
            }

            setError('');
            const isoDate = displayToIso(cleaned);

            // Check min/max
            if (min && isoDate < min) {
                setError(`Ngày phải sau ${isoToDisplay(min)}`);
                return;
            }
            if (max && isoDate > max) {
                setError(`Ngày phải trước ${isoToDisplay(max)}`);
                return;
            }

            // Call onChange with synthetic event
            if (onChange) {
                onChange({
                    target: {
                        name,
                        value: isoDate
                    }
                });
            }
        } else {
            setError('');
        }
    };

    // Handle blur - validate complete date
    const handleBlur = () => {
        if (displayValue && displayValue.length > 0 && displayValue.length < 10) {
            setError('Vui lòng nhập đầy đủ ngày (dd/mm/yyyy)');
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                inputMode="numeric"
                name={name}
                value={displayValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={`${className} ${error ? 'border-red-500' : ''}`}
                maxLength={10}
                {...props}
            />
            {error && (
                <div className="absolute text-xs text-red-500 mt-1">{error}</div>
            )}
        </div>
    );
}
