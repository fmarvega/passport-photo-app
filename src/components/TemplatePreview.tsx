
interface Props {
  templateDataUrl: string;
  onReset: () => void;
}

export function TemplatePreview({ templateDataUrl, onReset }: Props) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'passport_template.jpg';
    link.href = templateDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-4 max-w-full">
      <h2 className="text-xl font-bold">Your Printable Template</h2>
      <div className="max-w-full overflow-hidden">
        <img
          src={templateDataUrl}
          alt="Template preview"
          className="max-w-full h-auto border border-gray-300 shadow"
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download JPG
        </button>
        <button
          onClick={onReset}
          className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}