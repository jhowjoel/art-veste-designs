import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, Rect, Circle as FabricCircle, IText } from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Download, 
  MousePointer2, 
  Move, 
  RotateCcw, 
  Palette,
  Eraser,
  Square,
  Circle,
  Type,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pipeline, env } from '@huggingface/transformers';
import { ColorPicker } from "./ColorPicker";

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

interface ImageEditorProps {
  className?: string;
}

const MAX_IMAGE_DIMENSION = 1024;

export const ImageEditor = ({ className }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState<"select" | "move" | "draw" | "rectangle" | "circle" | "text" | "erase">("select");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    // Initialize the freeDrawingBrush
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = 2;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 2;
    }
  }, [activeTool, activeColor, fabricCanvas]);

  const resizeImageIfNeeded = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
        width = MAX_IMAGE_DIMENSION;
      } else {
        width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
        height = MAX_IMAGE_DIMENSION;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);
      return true;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);
    return false;
  };

  const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
    setIsProcessing(true);
    try {
      const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
        device: 'webgpu',
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const result = await segmenter(imageData);
      
      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error('Invalid segmentation result');
      }
      
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');
      
      if (!outputCtx) throw new Error('Could not get output canvas context');
      
      outputCtx.drawImage(canvas, 0, 0);
      
      const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
      const data = outputImageData.data;
      
      for (let i = 0; i < result[0].mask.data.length; i++) {
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }
      
      outputCtx.putImageData(outputImageData, 0, 0);
      
      return new Promise((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1.0
        );
      });
    } catch (error) {
      console.error('Error removing background:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    try {
      const img = await loadImage(file);
      
      const fabricImg = new FabricImage(img, {
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
      });
      
      fabricCanvas.add(fabricImg);
      fabricCanvas.renderAll();
      
      toast({
        title: "Imagem carregada",
        description: "Imagem adicionada ao canvas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar a imagem",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBackground = async () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (!activeObject || !(activeObject instanceof FabricImage)) {
      toast({
        title: "Seleção necessária",
        description: "Selecione uma imagem para remover o fundo",
        variant: "destructive",
      });
      return;
    }

    try {
      const img = activeObject.getElement() as HTMLImageElement;
      const blob = await removeBackground(img);
      
      const newImg = new Image();
      newImg.onload = () => {
        const fabricImg = new FabricImage(newImg, {
          left: activeObject.left,
          top: activeObject.top,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
        });
        
        fabricCanvas?.remove(activeObject);
        fabricCanvas?.add(fabricImg);
        fabricCanvas?.renderAll();
        
        toast({
          title: "Fundo removido",
          description: "Fundo da imagem removido com sucesso!",
        });
      };
      
      newImg.src = URL.createObjectURL(blob);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover o fundo da imagem",
        variant: "destructive",
      });
    }
  };

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 100,
      });
      fabricCanvas?.add(rect);
    } else if (tool === "circle") {
      const circle = new FabricCircle({
        left: 100,
        top: 100,
        fill: activeColor,
        radius: 50,
      });
      fabricCanvas?.add(circle);
    } else if (tool === "text") {
      const text = new IText('Texto', {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 20,
      });
      fabricCanvas?.add(text);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast({
      title: "Canvas limpo",
      description: "Canvas foi limpo com sucesso!",
    });
  };

  const handleDelete = () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (activeObject) {
      fabricCanvas?.remove(activeObject);
      fabricCanvas?.renderAll();
    }
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    });
    
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = dataURL;
    link.click();
    
    toast({
      title: "Download iniciado",
      description: "Sua imagem está sendo baixada!",
    });
  };

  const tools = [
    { id: "select", icon: MousePointer2, label: "Selecionar" },
    { id: "move", icon: Move, label: "Mover" },
    { id: "draw", icon: Palette, label: "Desenhar" },
    { id: "rectangle", icon: Square, label: "Retângulo" },
    { id: "circle", icon: Circle, label: "Círculo" },
    { id: "text", icon: Type, label: "Texto" },
    { id: "erase", icon: Eraser, label: "Apagar" },
  ] as const;

  const colors = ["#000000", "#ff0000", "#0000ff"];

  return (
    <div className={`flex h-full ${className}`}>
      {/* Toolbar lateral */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-white hover:bg-gray-800"
          title="Carregar Imagem"
        >
          <Upload className="h-5 w-5" />
        </Button>
        
        <Separator className="w-8 bg-gray-700" />
        
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon"
            onClick={() => handleToolClick(tool.id as any)}
            className={`text-white hover:bg-gray-800 ${
              activeTool === tool.id ? "bg-gray-700" : ""
            }`}
            title={tool.label}
          >
            <tool.icon className="h-5 w-5" />
          </Button>
        ))}
        
        <Separator className="w-8 bg-gray-700" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemoveBackground}
          disabled={isProcessing}
          className="text-white hover:bg-gray-800"
          title="Remover Fundo"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-white hover:bg-gray-800"
          title="Deletar Selecionado"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        
        <Separator className="w-8 bg-gray-700" />
        
        {/* Cores */}
        <div className="space-y-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`w-8 h-8 rounded border-2 ${
                activeColor === color ? "border-white" : "border-gray-600"
              }`}
              style={{ backgroundColor: color }}
              title={`Cor ${color}`}
            />
          ))}
        </div>
        
        <Separator className="w-8 bg-gray-700" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="text-white hover:bg-gray-800"
          title="Limpar Canvas"
        >
          <Eraser className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="text-white hover:bg-gray-800"
          title="Baixar Imagem"
        >
          <Download className="h-5 w-5" />
        </Button>
      </div>

      {/* Canvas principal */}
      <div className="flex-1 bg-gray-100 p-4">
        <Card className="h-full flex items-center justify-center bg-white">
          <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <canvas 
              ref={canvasRef} 
              className="max-w-full"
              style={{ display: "block" }}
            />
          </div>
        </Card>
      </div>

      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};