import React, { useRef, useState } from 'react';

const formats = [
  { label: 'PNG', value: 'image/png' },
  { label: 'JPG', value: 'image/jpeg' },
  { label: 'WEBP', value: 'image/webp' },
  { label: 'SVG', value: 'image/svg+xml' },
  { label: 'GIF', value: 'image/gif' },
  { label: 'BMP', value: 'image/bmp' },
  { label: 'TIFF', value: 'image/tiff' },
  { label: 'ICO', value: 'image/x-icon' },
];

function getExtension(mime: string) {
  switch (mime) {
    case 'image/png': return 'png';
    case 'image/jpeg': return 'jpg';
    case 'image/webp': return 'webp';
    case 'image/svg+xml': return 'svg';
    case 'image/gif': return 'gif';
    case 'image/bmp': return 'bmp';
    case 'image/tiff': return 'tiff';
    case 'image/x-icon': return 'ico';
    default: return 'img';
  }
}

export const ImageConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputType, setOutputType] = useState('image/png');
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (f: File) => {
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      if (outputType === 'image/svg+xml' && file.type !== 'image/svg+xml') {
        setError('Não é possível converter para SVG a partir de outros formatos.');
        setLoading(false);
        return;
      }
      if (outputType === 'image/x-icon') {
        // Converter para .ico (favicon 64x64)
        const img = new window.Image();
        img.src = preview!;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 64, 64);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `convertido.ico`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }
              setLoading(false);
            }, 'image/x-icon');
          } else {
            setError('Erro ao processar a imagem.');
            setLoading(false);
          }
        };
        img.onerror = () => {
          setError('Erro ao carregar a imagem.');
          setLoading(false);
        };
        return;
      }
      const img = new window.Image();
      img.src = preview!;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `convertido.${getExtension(outputType)}`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }
            setLoading(false);
          }, outputType);
        } else {
          setError('Erro ao processar a imagem.');
          setLoading(false);
        }
      };
      img.onerror = () => {
        setError('Erro ao carregar a imagem.');
        setLoading(false);
      };
    } catch (err) {
      setError('Erro ao converter a imagem.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center min-h-[420px] justify-center">
      <div className="mb-2 text-art-primary font-bold text-lg text-center">Converta sua imagem grátis!</div>
      <div
        className="w-full h-32 border-2 border-dashed border-art-primary rounded flex items-center justify-center cursor-pointer bg-art-bg mb-2"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-28 max-w-full object-contain" />
        ) : (
          <span className="text-gray-500">Arraste ou clique para selecionar</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
        }}
      />
      <div className="w-full mb-2">
        <label className="block text-sm font-medium mb-1">Formato de saída:</label>
        <select
          className="w-full border rounded p-1"
          value={outputType}
          onChange={e => setOutputType(e.target.value)}
        >
          {formats.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      <button
        className="bg-art-primary text-white px-4 py-2 rounded w-full font-semibold disabled:opacity-50"
        onClick={handleConvert}
        disabled={!file || loading}
      >
        {loading ? 'Convertendo...' : 'Converter e Baixar'}
      </button>
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      <div className="text-xs text-gray-500 mt-2 text-center">
        Suporte: PNG, JPG, WEBP, GIF, BMP, TIFF, ICO<br/>
        Para SVG, só é possível converter SVG para outros formatos.<br/>
        Para ICO, o ícone gerado é 64x64 pixels (ideal para favicon).
      </div>
    </div>
  );
}; 