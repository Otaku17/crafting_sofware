import React from 'react';
import styles from './Form.module.css';

// ── FormGroup ────────────────────────────────────────────────────────────────

interface FormGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}
export const FormGroup: React.FC<FormGroupProps> = ({ label, children, className }) => (
  <div className={`${styles.group} ${className ?? ''}`}>
    {label && <label className={styles.label}>{label}</label>}
    {children}
  </div>
);

// ── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  compact?: boolean;
}
export const Input: React.FC<InputProps> = ({ compact, className, ...props }) => (
  <input
    className={`${styles.input} ${compact ? styles.compact : ''} ${className ?? ''}`}
    {...props}
  />
);

// ── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  compact?: boolean;
  children: React.ReactNode;
}
export const Select: React.FC<SelectProps> = ({ compact, className, children, ...props }) => (
  <select
    className={`${styles.select} ${compact ? styles.compact : ''} ${className ?? ''}`}
    {...props}
  >
    {children}
  </select>
);
