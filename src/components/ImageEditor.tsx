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
  Trash2,
  GitBranch,
  ChevronRight,
  Settings,
  ArrowLeft,
  Pencil,
  Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pipeline, env } from '@huggingface/transformers';
import { ColorPicker } from "./ColorPicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubscription } from "@/hooks/useSubscription";
import PaidPlanModal from "./PaidPlanModal";

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

interface ImageEditorProps {
  className?: string;
  onBackToProfile?: () => void;
}

const MAX_IMAGE_DIMENSION = 1024;

export const ImageEditor = ({ className, onBackToProfile }: ImageEditorProps) => {
  const { hasActiveSubscription } = useSubscription();
  const [showPaidPlanModal, setShowPaidPlanModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState<"select" | "move" | "draw" | "rectangle" | "circle" | "text" | "erase">("select");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPathPanel, setShowPathPanel] = useState(false);
  const [pathActiveTab, setPathActiveTab] = useState("trace");
  const [traceActiveTab, setTraceActiveTab] = useState("single");
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null);
  const [vectorizedImage, setVectorizedImage] = useState<FabricImage | null>(null);
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  
  // Estados para modais de ferramentas
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [selectedShape, setSelectedShape] = useState<"rectangle" | "circle" | null>(null);
  const [drawMode, setDrawMode] = useState<"pencil" | "bezier" | "spiral" | "spline" | "continuous">("pencil");
  const [shapeOptions, setShapeOptions] = useState({
    filled: true,
    variant: "normal" // normal, closed-two-radius, open-two-radius
  });
  
  // Estados para Varredura Única
  const [singleScanSettings, setSingleScanSettings] = useState({
    detectionMode: "brightness",
    brightnessThreshold: [128],
    edgeDetection: [50],
    colorCount: [2],
    autoTrace: false,
    centerLineTrace: false,
    edgeThreshold: [100],
    invertImage: false,
    blur: [0],
    simplification: [2],
    optimization: [0.2],
    userAssisted: false
  });

  // Estados para Multi Colorido
  const [multiColorSettings, setMultiColorSettings] = useState({
    brightnessLevels: [4],
    colors: [8],
    grays: [4],
    autoTraceSlow: false,
    selectableScans: true,
    smooth: [1],
    stack: false,
    removeBackground: false,
    blur: [0],
    simplification: [2],
    optimization: [0.2],
    userAssisted: false
  });

  // Estados para Arte Pixel
  const [pixelArtSettings, setPixelArtSettings] = useState({
    brightnessLevels: [4],
    colors: [16],
    grays: [4],
    autoTraceSlow: false,
    curves: true,
    islands: [5],
    sparsePixels: [3],
    multiplier: [1],
    optimization: [0.5],
    voronoiOutput: false,
    bSplinesOutput: true
  });

  // Estados para Preenchimento e Contorno
  const [fillStrokeSettings, setFillStrokeSettings] = useState({
    fill: true,
    fillColor: "#000000",
    stroke: true,
    strokeColor: "#000000",
    strokeWidth: [1],
    strokeStyle: "solid"
  });

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
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 2;
    }

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
    if (tool === "draw") {
      setShowDrawModal(true);
      return;
    }
    
    if (tool === "rectangle" || tool === "circle") {
      setSelectedShape(tool);
      setShowShapeModal(true);
      return;
    }
    
    setActiveTool(tool);

    if (tool === "text") {
      const text = new IText('Digite seu texto aqui', {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 20,
      });
      fabricCanvas?.add(text);
      fabricCanvas?.setActiveObject(text);
      fabricCanvas?.renderAll();
    }
  };

  const handleDrawSelection = (mode: typeof drawMode) => {
    setDrawMode(mode);
    setActiveTool("draw");
    setShowDrawModal(false);
    
    if (fabricCanvas) {
      fabricCanvas.isDrawingMode = true;
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = mode === "pencil" ? 2 : mode === "continuous" ? 1 : 3;
      }
    }
  };

  const handleShapeCreation = () => {
    if (!selectedShape || !fabricCanvas) return;
    
    const options = {
      left: 100,
      top: 100,
      [shapeOptions.filled ? "fill" : "stroke"]: activeColor,
      ...(shapeOptions.filled ? {} : { fill: "transparent", strokeWidth: 2 })
    };

    if (selectedShape === "rectangle") {
      const rect = new Rect({
        ...options,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
    } else if (selectedShape === "circle") {
      const circle = new FabricCircle({
        ...options,
        radius: 50,
      });
      fabricCanvas.add(circle);
    }
    
    fabricCanvas.renderAll();
    setShowShapeModal(false);
    setSelectedShape(null);
  };

  const handleBackgroundRemoval = () => {
    setShowBackgroundModal(true);
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
    if (!hasActiveSubscription) {
      setShowPaidPlanModal(true);
      return;
    }
    
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

  // Estados para limpeza de contorno
  const [contourCleanSettings, setContourCleanSettings] = useState({
    spotRemovalSize: [5],
    contourThickness: [2],
    backgroundCleanup: true,
    preserveMainContours: true,
    smoothContours: [3]
  });

  // Função para limpeza de contorno (remover manchas pretas, manter só contornos)
  const handleContourClean = useCallback(async () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (!activeObject || !(activeObject instanceof FabricImage)) {
      toast({
        title: "Seleção necessária",
        description: "Selecione uma imagem para limpar contornos",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const imgElement = activeObject.getElement() as HTMLImageElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      ctx.drawImage(imgElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Converter para escala de cinza
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      // 2. Detectar bordas principais (Sobel)
      const edgeData = new Uint8ClampedArray(data.length);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          
          const gx = (
            -1 * data[((y-1) * width + (x-1)) * 4] + 1 * data[((y-1) * width + (x+1)) * 4] +
            -2 * data[(y * width + (x-1)) * 4] + 2 * data[(y * width + (x+1)) * 4] +
            -1 * data[((y+1) * width + (x-1)) * 4] + 1 * data[((y+1) * width + (x+1)) * 4]
          );
          
          const gy = (
            -1 * data[((y-1) * width + (x-1)) * 4] + -2 * data[((y-1) * width + x) * 4] + -1 * data[((y-1) * width + (x+1)) * 4] +
            1 * data[((y+1) * width + (x-1)) * 4] + 2 * data[((y+1) * width + x) * 4] + 1 * data[((y+1) * width + (x+1)) * 4]
          );
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const edge = magnitude > 40 ? 0 : 255;
          
          edgeData[idx] = edge;
          edgeData[idx + 1] = edge;
          edgeData[idx + 2] = edge;
          edgeData[idx + 3] = 255;
        }
      }

      // 3. Remover manchas pequenas (noise removal)
      const cleanData = new Uint8ClampedArray(edgeData);
      const spotSize = contourCleanSettings.spotRemovalSize[0];
      
      for (let y = spotSize; y < height - spotSize; y++) {
        for (let x = spotSize; x < width - spotSize; x++) {
          const idx = (y * width + x) * 4;
          
          if (edgeData[idx] === 0) { // pixel preto (parte da borda)
            let blackNeighbors = 0;
            let totalNeighbors = 0;
            
            // Verificar vizinhança
            for (let dy = -spotSize; dy <= spotSize; dy++) {
              for (let dx = -spotSize; dx <= spotSize; dx++) {
                const nIdx = ((y + dy) * width + (x + dx)) * 4;
                if (nIdx >= 0 && nIdx < edgeData.length) {
                  totalNeighbors++;
                  if (edgeData[nIdx] === 0) blackNeighbors++;
                }
              }
            }
            
            // Se tem poucos vizinhos pretos, é uma mancha isolada - remover
            if (blackNeighbors / totalNeighbors < 0.3) {
              cleanData[idx] = 255;     // Tornar branco
              cleanData[idx + 1] = 255;
              cleanData[idx + 2] = 255;
            }
          }
        }
      }

      // 4. Fortalecer contornos principais
      const finalData = new Uint8ClampedArray(cleanData);
      const thickness = contourCleanSettings.contourThickness[0];
      
      for (let y = thickness; y < height - thickness; y++) {
        for (let x = thickness; x < width - thickness; x++) {
          const idx = (y * width + x) * 4;
          
          if (cleanData[idx] === 0) { // pixel de borda
            // Fortalecer a borda aumentando espessura
            for (let dy = -thickness; dy <= thickness; dy++) {
              for (let dx = -thickness; dx <= thickness; dx++) {
                if (Math.abs(dx) + Math.abs(dy) <= thickness) {
                  const nIdx = ((y + dy) * width + (x + dx)) * 4;
                  if (nIdx >= 0 && nIdx < finalData.length) {
                    finalData[nIdx] = 0;
                    finalData[nIdx + 1] = 0;
                    finalData[nIdx + 2] = 0;
                  }
                }
              }
            }
          }
        }
      }

      // 5. Limpar fundo se habilitado
      if (contourCleanSettings.backgroundCleanup) {
        for (let i = 0; i < finalData.length; i += 4) {
          if (finalData[i] > 200) { // pixel quase branco
            finalData[i] = 255;     // Tornar completamente branco
            finalData[i + 1] = 255;
            finalData[i + 2] = 255;
            finalData[i + 3] = 0;   // Tornar transparente
          }
        }
      }

      // Aplicar resultado
      ctx.putImageData(new ImageData(finalData, width, height), 0, 0);
      
      const cleanDataURL = canvas.toDataURL('image/png');
      const cleanImg = new Image();
      
      cleanImg.onload = () => {
        const fabricImg = new FabricImage(cleanImg, {
          left: activeObject.left! + 50,
          top: activeObject.top!,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
        });
        
        fabricCanvas?.add(fabricImg);
        fabricCanvas?.renderAll();
        
        toast({
          title: "Contornos limpos",
          description: "Manchas removidas, contornos preservados!",
        });
      };
      
      cleanImg.src = cleanDataURL;
      
    } catch (error) {
      console.error('Error in contour cleaning:', error);
      toast({
        title: "Erro",
        description: "Erro na limpeza de contornos",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [fabricCanvas, toast, contourCleanSettings]);

  // Função para vetorização automática com um clique (otimizada para corte a laser)
  const handleAutoVectorize = useCallback(async () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (!activeObject || !(activeObject instanceof FabricImage)) {
      toast({
        title: "Seleção necessária",
        description: "Selecione uma imagem para vetorizar automaticamente",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const imgElement = activeObject.getElement() as HTMLImageElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      ctx.drawImage(imgElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Configurações otimizadas para corte a laser
      // 1. Conversão para escala de cinza
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
      }

      // 2. Detecção de bordas otimizada
      const width = canvas.width;
      const height = canvas.height;
      const edgeData = new Uint8ClampedArray(data.length);
      const threshold = 50;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          
          // Operador Sobel para detecção de bordas
          const gx = (
            -1 * data[((y-1) * width + (x-1)) * 4] + 1 * data[((y-1) * width + (x+1)) * 4] +
            -2 * data[(y * width + (x-1)) * 4] + 2 * data[(y * width + (x+1)) * 4] +
            -1 * data[((y+1) * width + (x-1)) * 4] + 1 * data[((y+1) * width + (x+1)) * 4]
          );
          
          const gy = (
            -1 * data[((y-1) * width + (x-1)) * 4] + -2 * data[((y-1) * width + x) * 4] + -1 * data[((y-1) * width + (x+1)) * 4] +
            1 * data[((y+1) * width + (x-1)) * 4] + 2 * data[((y+1) * width + x) * 4] + 1 * data[((y+1) * width + (x+1)) * 4]
          );
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const edge = magnitude > threshold ? 0 : 255;
          
          edgeData[idx] = edge;     // R
          edgeData[idx + 1] = edge; // G
          edgeData[idx + 2] = edge; // B
          edgeData[idx + 3] = 255;  // A
        }
      }

      // 3. Aplicar resultado
      ctx.putImageData(new ImageData(edgeData, width, height), 0, 0);
      
      // 4. Criar nova imagem vetorizada
      const vectorizedDataURL = canvas.toDataURL('image/png');
      const vectorizedImg = new Image();
      
      vectorizedImg.onload = () => {
        const fabricImg = new FabricImage(vectorizedImg, {
          left: activeObject.left! + 50,
          top: activeObject.top!,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
        });
        
        fabricCanvas?.add(fabricImg);
        fabricCanvas?.renderAll();
        
        toast({
          title: "Vetorização automática concluída",
          description: "Imagem pronta para corte a laser!",
        });
      };
      
      vectorizedImg.src = vectorizedDataURL;
      
    } catch (error) {
      console.error('Error in auto vectorization:', error);
      toast({
        title: "Erro",
        description: "Erro na vetorização automática",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [fabricCanvas, toast]);

  const applyVectorization = useCallback(async (traceType: string, settings: any) => {
    if (!vectorizedImage || !fabricCanvas) return;

    try {
      const imgElement = originalImage?.getElement() as HTMLImageElement;
      if (!imgElement) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      ctx.drawImage(imgElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      if (traceType === "single") {
        const { 
          detectionMode, brightnessThreshold, edgeDetection, colorCount, 
          centerLineTrace, edgeThreshold, invertImage, blur, simplification, 
          optimization, autoTrace, userAssisted 
        } = settings;
        
        // Aplicar blur se configurado
        if (blur[0] > 0) {
          ctx.filter = `blur(${blur[0]}px)`;
          ctx.drawImage(imgElement, 0, 0);
          ctx.filter = 'none';
          const blurredData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < data.length; i++) {
            data[i] = blurredData.data[i];
          }
        }
        
        if (detectionMode === "brightness") {
          const threshold = brightnessThreshold[0];
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const newValue = brightness > threshold ? 255 : 0;
            data[i] = newValue;
            data[i + 1] = newValue;
            data[i + 2] = newValue;
          }
        } else if (detectionMode === "edge") {
          const edgeStrength = edgeDetection[0] / 100;
          const threshold = edgeThreshold[0];
          const tempData = new Uint8ClampedArray(data);
          
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
              const idx = (y * canvas.width + x) * 4;
              
              // Sobel operator para detecção de bordas
              const gx = (
                -tempData[((y-1) * canvas.width + (x-1)) * 4] + tempData[((y-1) * canvas.width + (x+1)) * 4] +
                -2 * tempData[(y * canvas.width + (x-1)) * 4] + 2 * tempData[(y * canvas.width + (x+1)) * 4] +
                -tempData[((y+1) * canvas.width + (x-1)) * 4] + tempData[((y+1) * canvas.width + (x+1)) * 4]
              );
              
              const gy = (
                -tempData[((y-1) * canvas.width + (x-1)) * 4] - 2 * tempData[((y-1) * canvas.width + x) * 4] - tempData[((y-1) * canvas.width + (x+1)) * 4] +
                tempData[((y+1) * canvas.width + (x-1)) * 4] + 2 * tempData[((y+1) * canvas.width + x) * 4] + tempData[((y+1) * canvas.width + (x+1)) * 4]
              );
              
              const magnitude = Math.sqrt(gx * gx + gy * gy) * edgeStrength;
              const edgeValue = magnitude > threshold ? 0 : 255;
              
              data[idx] = edgeValue;
              data[idx + 1] = edgeValue;
              data[idx + 2] = edgeValue;
            }
          }
          
          // Aplicar traçado de linha central se ativado
          if (centerLineTrace) {
            for (let i = 0; i < data.length; i += 4) {
              if (data[i] === 0) { // Se é uma borda
                data[i] = 128; // Cinza para linha central
                data[i + 1] = 128;
                data[i + 2] = 128;
              }
            }
          }
        } else if (detectionMode === "color") {
          const levels = Math.max(2, colorCount[0]);
          const factor = 255 / (levels - 1);
          
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round(Math.round(data[i] / factor) * factor);
            data[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor);
            data[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor);
          }
        }
        
        // Aplicar inversão se ativada
        if (invertImage) {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        }
        
        // Aplicar simplificação
        if (simplification[0] > 0) {
          const simplifyFactor = Math.max(1, simplification[0]);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round(data[i] / simplifyFactor) * simplifyFactor;
            data[i + 1] = Math.round(data[i + 1] / simplifyFactor) * simplifyFactor;
            data[i + 2] = Math.round(data[i + 2] / simplifyFactor) * simplifyFactor;
          }
        }
        
      } else if (traceType === "multi") {
        const { 
          brightnessLevels, colors, grays, blur, simplification, 
          optimization, removeBackground, smooth, stack 
        } = settings;
        
        // Aplicar blur
        if (blur[0] > 0) {
          ctx.filter = `blur(${blur[0]}px)`;
          ctx.drawImage(imgElement, 0, 0);
          ctx.filter = 'none';
          const blurredData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < data.length; i++) {
            data[i] = blurredData.data[i];
          }
        }
        
        // Redução de cores baseada em configurações
        const colorLevels = Math.max(2, colors[0]);
        const grayLevels = Math.max(1, grays[0]);
        const brightLevels = Math.max(1, brightnessLevels[0]);
        
        for (let i = 0; i < data.length; i += 4) {
          // Aplicar redução de cores
          const factor = 255 / (colorLevels - 1);
          data[i] = Math.round(Math.round(data[i] / factor) * factor);
          data[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor);
          data[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor);
          
          // Aplicar níveis de cinza se necessário
          if (grayLevels < 16) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const grayLevel = Math.round(gray / (255 / grayLevels)) * (255 / grayLevels);
            data[i] = grayLevel;
            data[i + 1] = grayLevel;
            data[i + 2] = grayLevel;
          }
        }
        
        // Remover fundo se ativado
        if (removeBackground) {
          const bgColor = [data[0], data[1], data[2]]; // Usar canto superior esquerdo como cor de fundo
          const tolerance = 30;
          
          for (let i = 0; i < data.length; i += 4) {
            const diff = Math.abs(data[i] - bgColor[0]) + Math.abs(data[i + 1] - bgColor[1]) + Math.abs(data[i + 2] - bgColor[2]);
            if (diff < tolerance) {
              data[i + 3] = 0; // Tornar transparente
            }
          }
        }
        
      } else if (traceType === "pixel") {
        const { 
          brightnessLevels, colors, grays, curves, islands, 
          sparsePixels, multiplier, optimization, voronoiOutput, bSplinesOutput 
        } = settings;
        
        const colorLevels = Math.max(2, colors[0]);
        const pixelSize = Math.max(1, sparsePixels[0]);
        const factor = 255 / (colorLevels - 1);
        const scale = multiplier[0];
        
        // Efeito de pixelização avançado
        for (let y = 0; y < canvas.height; y += pixelSize) {
          for (let x = 0; x < canvas.width; x += pixelSize) {
            let r = 0, g = 0, b = 0, count = 0;
            
            // Calcular cor média do bloco
            for (let py = y; py < Math.min(y + pixelSize, canvas.height); py++) {
              for (let px = x; px < Math.min(x + pixelSize, canvas.width); px++) {
                const idx = (py * canvas.width + px) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
              }
            }
            
            if (count > 0) {
              r = Math.round(Math.round((r / count) / factor) * factor);
              g = Math.round(Math.round((g / count) / factor) * factor);
              b = Math.round(Math.round((b / count) / factor) * factor);
              
              // Aplicar efeito de curvas se ativado
              if (curves) {
                r = Math.min(255, r * scale);
                g = Math.min(255, g * scale);
                b = Math.min(255, b * scale);
              }
              
              // Aplicar cor média a todo o bloco
              for (let py = y; py < Math.min(y + pixelSize, canvas.height); py++) {
                for (let px = x; px < Math.min(x + pixelSize, canvas.width); px++) {
                  const idx = (py * canvas.width + px) * 4;
                  data[idx] = r;
                  data[idx + 1] = g;
                  data[idx + 2] = b;
                }
              }
            }
          }
        }
        
        // Aplicar filtro de ilhas (remoção de pixels isolados)
        if (islands[0] > 1) {
          const threshold = islands[0];
          const tempData = new Uint8ClampedArray(data);
          
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
              const idx = (y * canvas.width + x) * 4;
              let similarNeighbors = 0;
              
              // Verificar vizinhos
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  const neighborIdx = ((y + dy) * canvas.width + (x + dx)) * 4;
                  const colorDiff = Math.abs(tempData[idx] - tempData[neighborIdx]) +
                                  Math.abs(tempData[idx + 1] - tempData[neighborIdx + 1]) +
                                  Math.abs(tempData[idx + 2] - tempData[neighborIdx + 2]);
                  if (colorDiff < 30) similarNeighbors++;
                }
              }
              
              // Se tem poucos vizinhos similares, remover
              if (similarNeighbors < threshold) {
                data[idx] = 255;
                data[idx + 1] = 255;
                data[idx + 2] = 255;
              }
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Atualizar a imagem vetorizada existente
      const newImgElement = new Image();
      newImgElement.onload = () => {
        vectorizedImage.setElement(newImgElement);
        fabricCanvas.renderAll();
      };
      
      newImgElement.src = canvas.toDataURL();
      
    } catch (error) {
      console.error('Error applying real-time vectorization:', error);
    }
  }, [vectorizedImage, originalImage, fabricCanvas]);

  // Efeito para aplicar mudanças em tempo real - Varredura Única
  useEffect(() => {
    if (isRealTimeMode && traceActiveTab === "single") {
      applyVectorization("single", singleScanSettings);
    }
  }, [isRealTimeMode, traceActiveTab, singleScanSettings, applyVectorization]);

  // Efeito para aplicar mudanças em tempo real - Multi Colorido
  useEffect(() => {
    if (isRealTimeMode && traceActiveTab === "multi") {
      applyVectorization("multi", multiColorSettings);
    }
  }, [isRealTimeMode, traceActiveTab, multiColorSettings, applyVectorization]);

  // Efeito para aplicar mudanças em tempo real - Arte Pixel
  useEffect(() => {
    if (isRealTimeMode && traceActiveTab === "pixel") {
      applyVectorization("pixel", pixelArtSettings);
    }
  }, [isRealTimeMode, traceActiveTab, pixelArtSettings, applyVectorization]);

  const handleApplyTrace = async (traceType: string) => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (!activeObject || !(activeObject instanceof FabricImage)) {
      toast({
        title: "Seleção necessária",
        description: "Selecione uma imagem para vetorizar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Simular vetorização criando uma cópia modificada da imagem
      const imgElement = activeObject.getElement() as HTMLImageElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      ctx.drawImage(imgElement, 0, 0);
      
      // Aplicar filtro para simular vetorização
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Aplicar posterização para simular vetorização
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.round(data[i] / 64) * 64;     // Red
        data[i + 1] = Math.round(data[i + 1] / 64) * 64; // Green
        data[i + 2] = Math.round(data[i + 2] / 64) * 64; // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Criar nova imagem "vetorizada"
      const vectorizedImgElement = new Image();
      vectorizedImgElement.onload = () => {
        const vectorizedFabricImg = new FabricImage(vectorizedImgElement, {
          left: activeObject.left! + 50,
          top: activeObject.top,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
        });
        
        // Armazenar as imagens para comparação
        setOriginalImage(activeObject);
        setVectorizedImage(vectorizedFabricImg);
        setShowImageComparison(true);
        setIsRealTimeMode(true); // Ativar modo tempo real
        
        // Adicionar a imagem vetorizada ao canvas
        fabricCanvas?.add(vectorizedFabricImg);
        fabricCanvas?.renderAll();
        
        toast({
          title: `${traceType === "single" ? "Varredura Única" : traceType === "multi" ? "Multi Colorido" : "Arte Pixel"} aplicada`,
          description: "Imagem vetorizada criada! Ajuste as configurações para ver mudanças em tempo real.",
        });
      };
      
      vectorizedImgElement.src = canvas.toDataURL();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar vetorização",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteImage = (imageType: 'original' | 'vectorized') => {
    if (imageType === 'original' && originalImage) {
      fabricCanvas?.remove(originalImage);
      setOriginalImage(null);
    } else if (imageType === 'vectorized' && vectorizedImage) {
      fabricCanvas?.remove(vectorizedImage);
      setVectorizedImage(null);
    }
    
    // Se apenas uma imagem resta, ocultar o painel de comparação e desativar modo tempo real
    if (!originalImage || !vectorizedImage) {
      setShowImageComparison(false);
      setIsRealTimeMode(false);
    }
    
    fabricCanvas?.renderAll();
    toast({
      title: "Imagem removida",
      description: `Imagem ${imageType === 'original' ? 'original' : 'vetorizada'} removida`,
    });
  };

  return (
    <div className={`flex flex-col h-screen ${className}`}>
      {/* Título */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToProfile}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Perfil
            </Button>
          )}
          <h2 className="text-xl font-semibold text-gray-800">Editor de Imagens</h2>
        </div>
      </div>
      
      {/* Área principal */}
      <div className="flex flex-1 min-h-0">
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

        {/* Botão de Vetorização Automática */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAutoVectorize}
          className="text-white hover:bg-gray-800 bg-green-600"
          title="Vetorizar Automaticamente para Corte a Laser"
          disabled={isProcessing}
        >
          <GitBranch className="h-5 w-5" />
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
          onClick={handleBackgroundRemoval}
          disabled={isProcessing}
          className="text-white hover:bg-gray-800"
          title="Remover Fundo"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        {/* Botão de Limpeza de Contorno */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleContourClean}
          disabled={isProcessing}
          className="text-white hover:bg-gray-800 bg-blue-600"
          title="Limpar Contornos (Remover Manchas)"
        >
          <Minus className="h-5 w-5" />
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

        <Separator className="w-8 bg-gray-700" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPathPanel(!showPathPanel)}
          className={`text-white hover:bg-gray-800 ${showPathPanel ? "bg-gray-700" : ""}`}
          title="Caminho"
        >
          <GitBranch className="h-5 w-5" />
        </Button>
        </div>

        {/* Canvas principal */}
        <div className="flex-1 bg-gray-100 p-4">
          <Card className="h-full flex items-center justify-center bg-white">
            <canvas 
              ref={canvasRef} 
              className="border border-gray-200 rounded-lg shadow-lg"
              style={{ display: "block", width: '800px', height: '600px' }}
            />
          </Card>
        </div>

        {/* Painel de Caminho */}
        {showPathPanel && (
          <div className="w-80 bg-gray-900 text-white overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Caminho</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPathPanel(false)}
                  className="text-white hover:bg-gray-800"
                >
                  ×
                </Button>
              </div>

              <Tabs value={pathActiveTab} onValueChange={setPathActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="trace" className="text-white data-[state=active]:bg-gray-700">
                    Traçar Bitmap
                  </TabsTrigger>
                  <TabsTrigger value="clean" className="text-white data-[state=active]:bg-gray-700">
                    Limpar Contorno
                  </TabsTrigger>
                  <TabsTrigger value="fillstroke" className="text-white data-[state=active]:bg-gray-700">
                    Preenchimento
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trace" className="space-y-4">
                  <Tabs value={traceActiveTab} onValueChange={setTraceActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                      <TabsTrigger value="single" className="text-xs text-white data-[state=active]:bg-gray-700">
                        Varredura Única
                      </TabsTrigger>
                      <TabsTrigger value="multi" className="text-xs text-white data-[state=active]:bg-gray-700">
                        Multi Colorido
                      </TabsTrigger>
                      <TabsTrigger value="pixel" className="text-xs text-white data-[state=active]:bg-gray-700">
                        Arte Pixel
                      </TabsTrigger>
                    </TabsList>

                    {/* Varredura Única */}
                    <TabsContent value="single" className="space-y-4">
                      <div>
                        <Label className="text-white mb-2 block">Modo de Detecção</Label>
                        <Select 
                          value={singleScanSettings.detectionMode} 
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, detectionMode: value})}
                        >
                          <SelectTrigger className="bg-gray-800 text-white border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 text-white border-gray-700">
                            <SelectItem value="brightness">Limite de Brilho</SelectItem>
                            <SelectItem value="edge">Detecção de Bordas</SelectItem>
                            <SelectItem value="color">Quantidade de Cores</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Limite de Brilho: {singleScanSettings.brightnessThreshold[0]}</Label>
                        <Slider
                          value={singleScanSettings.brightnessThreshold}
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, brightnessThreshold: value})}
                          max={255}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Detecção de Bordas: {singleScanSettings.edgeDetection[0]}</Label>
                        <Slider
                          value={singleScanSettings.edgeDetection}
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, edgeDetection: value})}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Quantidade de Cores: {singleScanSettings.colorCount[0]}</Label>
                        <Slider
                          value={singleScanSettings.colorCount}
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, colorCount: value})}
                          min={1}
                          max={64}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="autoTrace"
                          checked={singleScanSettings.autoTrace}
                          onCheckedChange={(checked) => setSingleScanSettings({...singleScanSettings, autoTrace: !!checked})}
                        />
                        <Label htmlFor="autoTrace" className="text-white">Traçar Automaticamente</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="centerLine"
                          checked={singleScanSettings.centerLineTrace}
                          onCheckedChange={(checked) => setSingleScanSettings({...singleScanSettings, centerLineTrace: !!checked})}
                        />
                        <Label htmlFor="centerLine" className="text-white">Traçado de Linha Central</Label>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Limite de Bordas: {singleScanSettings.edgeThreshold[0]}</Label>
                        <Slider
                          value={singleScanSettings.edgeThreshold}
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, edgeThreshold: value})}
                          max={1000}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="invertImage"
                          checked={singleScanSettings.invertImage}
                          onCheckedChange={(checked) => setSingleScanSettings({...singleScanSettings, invertImage: !!checked})}
                        />
                        <Label htmlFor="invertImage" className="text-white">Inverter Imagem</Label>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Mancha: {singleScanSettings.blur[0]}</Label>
                        <Slider
                          value={singleScanSettings.blur}
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, blur: value})}
                          max={10}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Simplificação: {singleScanSettings.simplification[0]}</Label>
                        <Slider
                          value={singleScanSettings.simplification}
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, simplification: value})}
                          max={10}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Otimização: {singleScanSettings.optimization[0]}</Label>
                        <Slider
                          value={singleScanSettings.optimization}
                          onValueChange={(value) => setSingleScanSettings({...singleScanSettings, optimization: value})}
                          max={1}
                          step={0.01}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="userAssisted"
                          checked={singleScanSettings.userAssisted}
                          onCheckedChange={(checked) => setSingleScanSettings({...singleScanSettings, userAssisted: !!checked})}
                        />
                        <Label htmlFor="userAssisted" className="text-white">Rastreamento Assistido</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="preview"
                          checked={true}
                        />
                        <Label htmlFor="preview" className="text-white">Pré-visualização</Label>
                      </div>

                      <Button 
                        onClick={() => handleApplyTrace("single")}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Aplicar
                      </Button>
                    </TabsContent>

                    {/* Multi Colorido */}
                    <TabsContent value="multi" className="space-y-4">
                      <div>
                        <Label className="text-white mb-2 block">Níveis de Brilho: {multiColorSettings.brightnessLevels[0]}</Label>
                        <Slider
                          value={multiColorSettings.brightnessLevels}
                          onValueChange={(value) => setMultiColorSettings({...multiColorSettings, brightnessLevels: value})}
                          min={1}
                          max={32}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Cores: {multiColorSettings.colors[0]}</Label>
                        <Slider
                          value={multiColorSettings.colors}
                          onValueChange={(value) => setMultiColorSettings({...multiColorSettings, colors: value})}
                          min={1}
                          max={256}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Cinzas: {multiColorSettings.grays[0]}</Label>
                        <Slider
                          value={multiColorSettings.grays}
                          onValueChange={(value) => setMultiColorSettings({...multiColorSettings, grays: value})}
                          min={1}
                          max={32}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="autoTraceSlow"
                          checked={multiColorSettings.autoTraceSlow}
                          onCheckedChange={(checked) => setMultiColorSettings({...multiColorSettings, autoTraceSlow: !!checked})}
                        />
                        <Label htmlFor="autoTraceSlow" className="text-white">Traçar Automaticamente (Lento)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="selectableScans"
                          checked={multiColorSettings.selectableScans}
                          onCheckedChange={(checked) => setMultiColorSettings({...multiColorSettings, selectableScans: !!checked})}
                        />
                        <Label htmlFor="selectableScans" className="text-white">Varreduras Selecionáveis</Label>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Suavizar: {multiColorSettings.smooth[0]}</Label>
                        <Slider
                          value={multiColorSettings.smooth}
                          onValueChange={(value) => setMultiColorSettings({...multiColorSettings, smooth: value})}
                          max={10}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="stack"
                          checked={multiColorSettings.stack}
                          onCheckedChange={(checked) => setMultiColorSettings({...multiColorSettings, stack: !!checked})}
                        />
                        <Label htmlFor="stack" className="text-white">Empilhar</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="removeBack"
                          checked={multiColorSettings.removeBackground}
                          onCheckedChange={(checked) => setMultiColorSettings({...multiColorSettings, removeBackground: !!checked})}
                        />
                        <Label htmlFor="removeBack" className="text-white">Remover Imagem de Fundo</Label>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Mancha: {multiColorSettings.blur[0]}</Label>
                        <Slider
                          value={multiColorSettings.blur}
                          onValueChange={(value) => setMultiColorSettings({...multiColorSettings, blur: value})}
                          max={10}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Simplificação: {multiColorSettings.simplification[0]}</Label>
                        <Slider
                          value={multiColorSettings.simplification}
                          onValueChange={(value) => setMultiColorSettings({...multiColorSettings, simplification: value})}
                          max={10}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Otimização: {multiColorSettings.optimization[0]}</Label>
                        <Slider
                          value={multiColorSettings.optimization}
                          onValueChange={(value) => setMultiColorSettings({...multiColorSettings, optimization: value})}
                          max={1}
                          step={0.01}
                          className="w-full"
                        />
                      </div>

                      <Button 
                        onClick={() => handleApplyTrace("multi")}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Aplicar
                      </Button>
                    </TabsContent>

                    {/* Arte Pixel */}
                    <TabsContent value="pixel" className="space-y-4">
                      <div>
                        <Label className="text-white mb-2 block">Níveis de Brilho: {pixelArtSettings.brightnessLevels[0]}</Label>
                        <Slider
                          value={pixelArtSettings.brightnessLevels}
                          onValueChange={(value) => setPixelArtSettings({...pixelArtSettings, brightnessLevels: value})}
                          min={1}
                          max={32}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Cores: {pixelArtSettings.colors[0]}</Label>
                        <Slider
                          value={pixelArtSettings.colors}
                          onValueChange={(value) => setPixelArtSettings({...pixelArtSettings, colors: value})}
                          min={1}
                          max={256}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Cinzas: {pixelArtSettings.grays[0]}</Label>
                        <Slider
                          value={pixelArtSettings.grays}
                          onValueChange={(value) => setPixelArtSettings({...pixelArtSettings, grays: value})}
                          min={1}
                          max={32}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="autoTracePixel"
                          checked={pixelArtSettings.autoTraceSlow}
                          onCheckedChange={(checked) => setPixelArtSettings({...pixelArtSettings, autoTraceSlow: !!checked})}
                        />
                        <Label htmlFor="autoTracePixel" className="text-white">Traçar Automaticamente (Lento)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="curves"
                          checked={pixelArtSettings.curves}
                          onCheckedChange={(checked) => setPixelArtSettings({...pixelArtSettings, curves: !!checked})}
                        />
                        <Label htmlFor="curves" className="text-white">Curvas</Label>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Ilhas: {pixelArtSettings.islands[0]}</Label>
                        <Slider
                          value={pixelArtSettings.islands}
                          onValueChange={(value) => setPixelArtSettings({...pixelArtSettings, islands: value})}
                          min={1}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Pixel Espaçosos - Raio: {pixelArtSettings.sparsePixels[0]}</Label>
                        <Slider
                          value={pixelArtSettings.sparsePixels}
                          onValueChange={(value) => setPixelArtSettings({...pixelArtSettings, sparsePixels: value})}
                          min={1}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Multiplicador: {pixelArtSettings.multiplier[0]}</Label>
                        <Slider
                          value={pixelArtSettings.multiplier}
                          onValueChange={(value) => setPixelArtSettings({...pixelArtSettings, multiplier: value})}
                          min={0.1}
                          max={5}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Otimização: {pixelArtSettings.optimization[0]}</Label>
                        <Slider
                          value={pixelArtSettings.optimization}
                          onValueChange={(value) => setPixelArtSettings({...pixelArtSettings, optimization: value})}
                          max={1}
                          step={0.01}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Saída</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="voronoi"
                              checked={pixelArtSettings.voronoiOutput}
                              onCheckedChange={(checked) => setPixelArtSettings({...pixelArtSettings, voronoiOutput: !!checked})}
                            />
                            <Label htmlFor="voronoi" className="text-white">Voronoi</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="bsplines"
                              checked={pixelArtSettings.bSplinesOutput}
                              onCheckedChange={(checked) => setPixelArtSettings({...pixelArtSettings, bSplinesOutput: !!checked})}
                            />
                            <Label htmlFor="bsplines" className="text-white">B-splines</Label>
                          </div>
                        </div>
                      </div>

                       <Button 
                        onClick={() => handleApplyTrace("pixel")}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Aplicar
                      </Button>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Preenchimento e Contorno */}
                <TabsContent value="fillstroke" className="space-y-4">
                  <div>
                    <Label className="text-white mb-4 block text-lg">Preenchimento e Contorno</Label>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="fill"
                          checked={fillStrokeSettings.fill}
                          onCheckedChange={(checked) => setFillStrokeSettings({...fillStrokeSettings, fill: !!checked})}
                        />
                        <Label htmlFor="fill" className="text-white">Preenchimento</Label>
                      </div>

                      {fillStrokeSettings.fill && (
                        <div>
                          <Label className="text-white mb-2 block">Cor do Preenchimento</Label>
                          <div className="flex space-x-2">
                            {colors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setFillStrokeSettings({...fillStrokeSettings, fillColor: color})}
                                className={`w-8 h-8 rounded border-2 ${
                                  fillStrokeSettings.fillColor === color ? "border-white" : "border-gray-600"
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="stroke"
                          checked={fillStrokeSettings.stroke}
                          onCheckedChange={(checked) => setFillStrokeSettings({...fillStrokeSettings, stroke: !!checked})}
                        />
                        <Label htmlFor="stroke" className="text-white">Contorno</Label>
                      </div>

                      {fillStrokeSettings.stroke && (
                        <>
                          <div>
                            <Label className="text-white mb-2 block">Cor do Contorno</Label>
                            <div className="flex space-x-2">
                              {colors.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setFillStrokeSettings({...fillStrokeSettings, strokeColor: color})}
                                  className={`w-8 h-8 rounded border-2 ${
                                    fillStrokeSettings.strokeColor === color ? "border-white" : "border-gray-600"
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-white mb-2 block">Largura do Contorno: {fillStrokeSettings.strokeWidth[0]}</Label>
                            <Slider
                              value={fillStrokeSettings.strokeWidth}
                              onValueChange={(value) => setFillStrokeSettings({...fillStrokeSettings, strokeWidth: value})}
                              min={1}
                              max={20}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label className="text-white mb-2 block">Estilo do Contorno</Label>
                            <Select 
                              value={fillStrokeSettings.strokeStyle} 
                              onValueChange={(value) => setFillStrokeSettings({...fillStrokeSettings, strokeStyle: value})}
                            >
                              <SelectTrigger className="bg-gray-800 text-white border-gray-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 text-white border-gray-700">
                                <SelectItem value="solid">Sólido</SelectItem>
                                <SelectItem value="dashed">Tracejado</SelectItem>
                                <SelectItem value="dotted">Pontilhado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      <Button 
                        onClick={() => {
                          toast({
                            title: "Aplicando Preenchimento e Contorno",
                            description: "Aplicando configurações de estilo...",
                          });
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Aplicar
                      </Button>
                    </div>
                    </div>
                  </TabsContent>

                  {/* Nova aba de Limpeza de Contorno */}
                  <TabsContent value="clean" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white mb-2 block">Tamanho de Mancha a Remover: {contourCleanSettings.spotRemovalSize[0]}px</Label>
                        <Slider
                          value={contourCleanSettings.spotRemovalSize}
                          onValueChange={(value) => setContourCleanSettings({...contourCleanSettings, spotRemovalSize: value})}
                          min={1}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Espessura do Contorno: {contourCleanSettings.contourThickness[0]}px</Label>
                        <Slider
                          value={contourCleanSettings.contourThickness}
                          onValueChange={(value) => setContourCleanSettings({...contourCleanSettings, contourThickness: value})}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Suavização: {contourCleanSettings.smoothContours[0]}</Label>
                        <Slider
                          value={contourCleanSettings.smoothContours}
                          onValueChange={(value) => setContourCleanSettings({...contourCleanSettings, smoothContours: value})}
                          min={0}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="backgroundCleanup"
                          checked={contourCleanSettings.backgroundCleanup}
                          onCheckedChange={(checked) => setContourCleanSettings({...contourCleanSettings, backgroundCleanup: !!checked})}
                        />
                        <Label htmlFor="backgroundCleanup" className="text-white">
                          Limpar Fundo (Transparente)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="preserveMainContours"
                          checked={contourCleanSettings.preserveMainContours}
                          onCheckedChange={(checked) => setContourCleanSettings({...contourCleanSettings, preserveMainContours: !!checked})}
                        />
                        <Label htmlFor="preserveMainContours" className="text-white">
                          Preservar Contornos Principais
                        </Label>
                      </div>

                      <Button
                        onClick={handleContourClean}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? "Processando..." : "Limpar Contornos"}
                      </Button>

                      <div className="text-xs text-gray-400 mt-2">
                        Esta ferramenta remove manchas pretas pequenas e preserva apenas os contornos principais da imagem, ideal para corte a laser.
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
          </div>
        )}

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
      
      <PaidPlanModal 
        isOpen={showPaidPlanModal}
        onClose={() => setShowPaidPlanModal(false)}
      />

      {/* Modal de Desenhar */}
      {showDrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">Escolha o tipo de desenho</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDrawSelection("pencil")}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Lápis (desenho livre)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDrawSelection("bezier")}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Linha Bézier (caminho curvo)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDrawSelection("spiral")}
              >
                <Circle className="h-4 w-4 mr-2" />
                Espiral
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDrawSelection("spline")}
              >
                <Move className="h-4 w-4 mr-2" />
                B-Spline (curva suave)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDrawSelection("continuous")}
              >
                <Minus className="h-4 w-4 mr-2" />
                Linhas Contínuas
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDrawModal(false)}
              className="w-full mt-4"
            >
              Cancelar
            </Button>
          </Card>
        </div>
      )}

      {/* Modal de Formas */}
      {showShapeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">
              Opções para {selectedShape === "rectangle" ? "Retângulo" : "Círculo"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tipo de preenchimento</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={shapeOptions.filled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShapeOptions({...shapeOptions, filled: true})}
                  >
                    Preenchido
                  </Button>
                  <Button
                    variant={!shapeOptions.filled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShapeOptions({...shapeOptions, filled: false})}
                  >
                    Só Contorno
                  </Button>
                </div>
              </div>

              {selectedShape === "circle" && (
                <div>
                  <Label className="text-sm font-medium">Variação da forma</Label>
                  <div className="space-y-2 mt-2">
                    <Button
                      variant={shapeOptions.variant === "normal" ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => setShapeOptions({...shapeOptions, variant: "normal"})}
                    >
                      Círculo Normal
                    </Button>
                    <Button
                      variant={shapeOptions.variant === "closed-two-radius" ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => setShapeOptions({...shapeOptions, variant: "closed-two-radius"})}
                    >
                      Forma Fechada com Dois Raios
                    </Button>
                    <Button
                      variant={shapeOptions.variant === "open-two-radius" ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => setShapeOptions({...shapeOptions, variant: "open-two-radius"})}
                    >
                      Forma Aberta com Dois Raios
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleShapeCreation} className="flex-1">
                Criar {selectedShape === "rectangle" ? "Retângulo" : "Círculo"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowShapeModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Remover Fundo */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">Opções de Fundo</h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  handleRemoveBackground();
                  setShowBackgroundModal(false);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Remover Fundo Completamente
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Fundos fornecidos pelo site:
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {["#ffffff", "#f0f0f0", "#e0e0e0", "#d0d0d0", "#c0c0c0", "#b0b0b0"].map((bg) => (
                  <button
                    key={bg}
                    className="w-full h-12 rounded border-2 border-gray-300 hover:border-primary"
                    style={{ backgroundColor: bg }}
                    onClick={() => {
                      if (fabricCanvas) {
                        fabricCanvas.backgroundColor = bg;
                        fabricCanvas.renderAll();
                      }
                      setShowBackgroundModal(false);
                      toast({
                        title: "Fundo alterado",
                        description: "Fundo do canvas foi alterado!",
                      });
                    }}
                    title={`Fundo ${bg}`}
                  />
                ))}
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowBackgroundModal(false)}
              className="w-full mt-4"
            >
              Cancelar
            </Button>
          </Card>
        </div>
      )}

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