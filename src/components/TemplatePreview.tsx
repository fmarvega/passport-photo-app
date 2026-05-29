import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, RotateCcw } from 'lucide-react';

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
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Your printable template</CardTitle>
        <CardDescription>
          15 × 10 cm · 300 DPI · 5 × 3 grid · ready to print
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="w-full overflow-hidden rounded-lg border border-[hsl(var(--border))]">
          <img
            src={templateDataUrl}
            alt="Template preview"
            className="w-full h-auto block"
          />
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button size="lg" className="gap-2" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download JPG
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}