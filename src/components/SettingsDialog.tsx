import type { Settings, TextSize, Theme } from '../state/storage';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" className="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
      {checked ? 'SÍ' : 'NO'}
    </button>
  );
}

export function SettingsDialog({ open, settings, onChange, onClose }: Props) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });
  return (
    <Modal open={open} title="Ajustes" onClose={onClose} closeLabel="Listo">
      <div className="setting">
        <div className="label">
          <strong>Tamaño de letra</strong>
          <span>Agrande los textos y botones si lo necesita.</span>
        </div>
        <Segmented<TextSize>
          label="Tamaño de letra"
          value={settings.textSize}
          onChange={(v) => set('textSize', v)}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'grande', label: 'Grande' },
            { value: 'muy-grande', label: 'Muy grande' },
          ]}
        />
      </div>
      <div className="setting">
        <div className="label">
          <strong>Colores</strong>
          <span>El modo «Contraste» resalta todo en blanco y negro.</span>
        </div>
        <Segmented<Theme>
          label="Colores"
          value={settings.theme}
          onChange={(v) => set('theme', v)}
          options={[
            { value: 'claro', label: 'Claro' },
            { value: 'oscuro', label: 'Oscuro' },
            { value: 'contraste', label: 'Contraste' },
          ]}
        />
      </div>
      <div className="setting">
        <div className="label">
          <strong>Resaltar números iguales</strong>
          <span>Al tocar un 5 se iluminan todos los 5.</span>
        </div>
        <Switch label="Resaltar números iguales" checked={settings.highlightSame} onChange={(v) => set('highlightSame', v)} />
      </div>
      <div className="setting">
        <div className="label">
          <strong>Mostrar el reloj</strong>
          <span>Quítelo si prefiere jugar sin mirar el tiempo.</span>
        </div>
        <Switch label="Mostrar el reloj" checked={settings.showTimer} onChange={(v) => set('showTimer', v)} />
      </div>
      <div className="setting">
        <div className="label">
          <strong>Sonidos</strong>
          <span>Pequeños sonidos suaves al jugar.</span>
        </div>
        <Switch label="Sonidos" checked={settings.sound} onChange={(v) => set('sound', v)} />
      </div>
    </Modal>
  );
}
