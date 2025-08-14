import { Package, Mail, Instagram, Facebook, Twitter, CheckSquare, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "5.00",
    category: "",
    file: null as File | null, // preview do produto
    images: [] as File[], // arquivos do produto
  });
  // Novo estado para categorias
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedDeleteCategory, setSelectedDeleteCategory] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string>("");
  const [deleteSuccess, setDeleteSuccess] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Buscar todas as categorias ao abrir o formulário
  useEffect(() => {
    if (showAdminForm) {
      supabase.from("categories").select("id, name").order("name").then(({ data }) => {
        setCategories(data || []);
        // Se não houver categoria selecionada, selecionar a primeira
        if (data && data.length > 0 && !form.category) {
          setForm(f => ({ ...f, category: data[0].id }));
        }
      });
    }
  }, [showAdminForm]);

  // Atualizar categoryId sempre que form.category mudar
  useEffect(() => {
    setCategoryId(form.category || null);
  }, [form.category]);

  // Buscar produtos da categoria selecionada
  const { data: productsToDelete = [], refetch: refetchProductsToDelete } = useQuery({
    queryKey: ["admin-products", selectedDeleteCategory],
    queryFn: async () => {
      if (!selectedDeleteCategory) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", selectedDeleteCategory);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDeleteCategory
  });

  // Função para deletar produto e arquivos
  async function handleDeleteProduct(product: any) {
    setDeleteLoading(product.id);
    setDeleteError("");
    setDeleteSuccess("");
    try {
      // Deletar arquivos do storage (capa e imagens)
      const filesToDelete = [];
      if (product.capa_url) {
        const path = product.capa_url.split("/art-files/")[1];
        if (path) filesToDelete.push(path);
      }
      if (Array.isArray(product.images_urls)) {
        for (const url of product.images_urls) {
          const path = url.split("/art-files/")[1];
          if (path) filesToDelete.push(path);
        }
      }
      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from("art-files").remove(filesToDelete);
        if (storageError) throw storageError;
      }
      // Deletar do banco
      const { error: dbError } = await supabase.from("products").delete().eq("id", product.id);
      if (dbError) throw dbError;
      setDeleteSuccess("Produto deletado com sucesso!");
      refetchProductsToDelete();
    } catch (err: any) {
      setDeleteError(err.message || "Erro ao deletar produto.");
    } finally {
      setDeleteLoading("");
    }
  }

  // Função para seleção múltipla
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Selecionar/deselecionar todos
  const toggleSelectAll = () => {
    if (selectedProducts.length === productsToDelete.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsToDelete.map(p => p.id));
    }
  };

  // Deletar produtos selecionados
  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    
    setDeleteLoading("bulk");
    setDeleteError("");
    setDeleteSuccess("");
    
    try {
      for (const productId of selectedProducts) {
        const product = productsToDelete.find(p => p.id === productId);
        if (!product) continue;

        // Deletar arquivos do storage
        const filesToDelete = [];
        if (product.capa_url) {
          const path = product.capa_url.split("/art-files/")[1];
          if (path) filesToDelete.push(path);
        }
        if (Array.isArray(product.images_urls)) {
          for (const url of product.images_urls) {
            const path = url.split("/art-files/")[1];
            if (path) filesToDelete.push(path);
          }
        }
        if (filesToDelete.length > 0) {
          await supabase.storage.from("art-files").remove(filesToDelete);
        }
      }

      // Deletar produtos do banco
      const { error: dbError } = await supabase
        .from("products")
        .delete()
        .in("id", selectedProducts);
      
      if (dbError) throw dbError;
      
      setDeleteSuccess(`${selectedProducts.length} produtos deletados com sucesso!`);
      setSelectedProducts([]);
      refetchProductsToDelete();
    } catch (err: any) {
      setDeleteError(err.message || "Erro ao deletar produtos.");
    } finally {
      setDeleteLoading("");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      if (!form.name || !form.description || !form.price || !form.file || !categoryId) {
        setError("Preencha todos os campos e selecione um preview do produto.");
        setLoading(false);
        return;
      }
      // Upload do preview do produto
      const extCapa = form.file.name.split('.').pop();
      const filePathCapa = `products/capa-${Date.now()}-${form.file.name}`;
      const { data: uploadCapa, error: uploadCapaError } = await supabase.storage.from("art-files").upload(filePathCapa, form.file);
      if (uploadCapaError) throw uploadCapaError;
      const { data: publicUrlCapa } = supabase.storage.from("art-files").getPublicUrl(filePathCapa);
      const capaUrl = publicUrlCapa.publicUrl;
      // Upload dos arquivos do produto
      let imagesUrls: string[] = [];
      for (const img of form.images) {
        const ext = img.name.split('.').pop();
        const filePath = `products/${Date.now()}-${img.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("art-files").upload(filePath, img);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("art-files").getPublicUrl(filePath);
        imagesUrls.push(publicUrlData.publicUrl);
      }
      // Salvar produto no banco
      const { error: insertError } = await supabase.from("products").insert({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category_id: categoryId,
        capa_url: capaUrl,
        images_urls: imagesUrls,
        is_active: true,
        png_preview_url: capaUrl, // usa a capa como preview principal
        svg_file_url: "", // se não for SVG, string vazia
      });
      if (insertError) throw insertError;
      setSuccess("Produto cadastrado com sucesso!");
      setForm({ name: "", description: "", price: "5.00", category: form.category, file: null, images: [] });
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar produto.");
    } finally {
      setLoading(false);
    }
  }

  // Drag modal logic
  const dragRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, left: 0, top: 0 });
  function onDragMouseDown(e: React.MouseEvent) {
    const modal = dragRef.current;
    if (!modal) return;
    pos.current = {
      x: e.clientX,
      y: e.clientY,
      left: modal.offsetLeft,
      top: modal.offsetTop,
    };
    function onMouseMove(ev: MouseEvent) {
      const dx = ev.clientX - pos.current.x;
      const dy = ev.clientY - pos.current.y;
      modal.style.left = `${pos.current.left + dx}px`;
      modal.style.top = `${pos.current.top + dy}px`;
    }
    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-8 w-8 text-art-primary" />
              <span className="text-2xl font-bold font-heading">Presynter</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-art-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-art-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-art-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-art-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/catalog" className="text-gray-300 hover:text-art-primary transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-gray-300 hover:text-art-primary transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-gray-300 hover:text-art-primary transition-colors">
                  Carrinho
                </Link>
              </li>
              <li>
                <Link to={user ? "/profile" : "/auth"} className="text-gray-300 hover:text-art-primary transition-colors">
                  Minha conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/how-to-buy" className="text-gray-300 hover:text-art-primary transition-colors">
                  Como comprar
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-art-primary transition-colors">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-art-primary transition-colors">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-art-primary transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Presynter. {t('footer.allRightsReserved')}</p>
          {user?.email === "jota100clock@gmail.com" && (
            <button
              className="ml-4 px-4 py-2 bg-art-primary text-white rounded hover:bg-art-primary/80 transition-colors"
              onClick={() => setShowAdminForm(true)}
            >
              ADM
            </button>
          )}
        </div>
        {showAdminForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              ref={dragRef}
              className="bg-white p-4 rounded-2xl shadow-2xl w-[90vw] max-w-xs sm:max-w-sm md:max-w-md min-w-[180px] max-h-[80vh] overflow-y-auto relative border-2 border-art-primary transition-all duration-300 cursor-move"
              style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            >
              <div
                className="absolute left-0 top-0 w-full h-8 cursor-move z-10 rounded-t-2xl bg-gradient-to-r from-art-primary/80 to-art-primary/40 flex items-center px-4 text-white font-bold shadow"
                onMouseDown={onDragMouseDown}
                title="Arraste para mover"
              >
                <span>Administração</span>
              </div>
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 bg-white rounded-full shadow p-1 border border-gray-200 z-20"
                onClick={() => setShowAdminForm(false)}
              >
                X
              </button>
              <div className="pt-10 pb-2 px-1">
                <h2 className="text-xl font-bold mb-2 text-art-primary text-center">Cadastrar Produto</h2>
                {/* Formulário de cadastro de produto (campos a implementar) */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Nome do Produto</label>
                    <input className="w-full border rounded px-3 py-2 !text-white !bg-black" type="text" placeholder="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Descrição</label>
                    <textarea className="w-full border rounded px-3 py-2 !text-white !bg-black" placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Preço (R$)</label>
                    <input className="w-full border rounded px-3 py-2 !text-white !bg-black" type="number" step="0.01" placeholder="5.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Categoria</label>
                    <select
                      className="w-full border rounded px-3 py-2 !text-white !bg-black"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Preview do Produto <span className='text-xs text-art-primary'>(será o preview principal)</span></label>
                    <input
                      className="w-full !text-white !bg-black"
                      type="file"
                      accept="image/*"
                      onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                    />
                    {form.file && (
                      <div className="mt-2 flex items-center gap-2 border border-art-primary rounded p-2 bg-gray-100">
                        <img src={URL.createObjectURL(form.file)} alt="Capa" className="h-16 w-16 object-cover rounded border-2 border-art-primary" />
                        <span className="text-art-primary font-bold">Capa</span>
                        <button type="button" className="text-red-600 text-xs ml-2" onClick={() => setForm(f => ({ ...f, file: null }))}>Remover</button>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Arquivos do Produto <span className='text-xs text-gray-400'>(SVG, DXF, PDF etc.)</span></label>
                    <input
                      className="w-full !text-white !bg-black"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => setForm(f => ({ ...f, images: e.target.files ? Array.from(e.target.files) : [] }))}
                    />
                    {form.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="relative group border rounded p-1 bg-gray-50">
                            <img src={URL.createObjectURL(img)} alt={`Produto ${idx+1}`} className="h-16 w-16 object-cover rounded" />
                            <span className="absolute bottom-0 left-0 bg-art-primary text-white text-xs px-1 rounded-tr">Arquivo</span>
                            <button
                              type="button"
                              className="absolute top-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 rounded group-hover:bg-red-600"
                              onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {error && <div className="text-red-600 mb-2">{error}</div>}
                  {success && <div className="text-green-600 mb-2">{success}</div>}
                  <div className="mt-6 flex justify-center sticky bottom-0 bg-white pt-4 z-20">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-art-primary text-white rounded font-bold hover:bg-art-primary/90 transition-colors shadow-lg"
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : "Salvar Produto"}
                    </button>
                  </div>
                </form>
              </div>
              <div className="mt-8 border-t pt-4">
                <h2 className="text-lg font-bold mb-2 text-art-primary text-center">Gerenciar Produtos</h2>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Categoria</label>
                  <select
                    className="w-full border rounded px-3 py-2 !text-white !bg-black"
                    value={selectedDeleteCategory}
                    onChange={e => {
                      setSelectedDeleteCategory(e.target.value);
                      setSelectedProducts([]);
                    }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {selectedDeleteCategory && (
                  <div className="space-y-3">
                    {productsToDelete?.length === 0 && (
                      <div className="text-gray-500 text-center py-4">
                        Nenhum produto nesta categoria.
                      </div>
                    )}
                    
                    {productsToDelete?.length > 0 && (
                      <>
                        {/* Controles de seleção múltipla */}
                        <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={toggleSelectAll}
                              className="flex items-center gap-2 text-sm hover:text-art-primary transition-colors"
                            >
                              {selectedProducts.length === productsToDelete.length ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                              Selecionar todos
                            </button>
                            <span className="text-gray-600 text-sm">
                              ({selectedProducts.length} de {productsToDelete.length} selecionados)
                            </span>
                          </div>
                          {selectedProducts.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button 
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                                  disabled={deleteLoading === "bulk"}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {deleteLoading === "bulk" ? "Deletando..." : `Deletar (${selectedProducts.length})`}
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Confirmar exclusão múltipla</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar {selectedProducts.length} produto(s) selecionado(s)? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                                <div className="flex gap-2 justify-end mt-4">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={handleDeleteSelected} 
                                    disabled={deleteLoading === "bulk"}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deleteLoading === "bulk" ? "Deletando..." : "Deletar Selecionados"}
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>

                        {/* Lista de produtos */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {productsToDelete?.map((product: any) => (
                            <div key={product.id} className="flex items-center justify-between border rounded p-2 bg-gray-50">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleProductSelection(product.id)}
                                  className="text-art-primary hover:text-art-primary/80 transition-colors"
                                >
                                  {selectedProducts.includes(product.id) ? (
                                    <CheckSquare className="h-4 w-4" />
                                  ) : (
                                    <Square className="h-4 w-4" />
                                  )}
                                </button>
                                <img src={product.capa_url} alt={product.name} className="h-10 w-10 object-cover rounded border" />
                                <div>
                                  <span className="font-semibold text-art-primary block">{product.name}</span>
                                  <span className="text-xs text-gray-600">R$ {product.price}</span>
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button 
                                    className="text-red-600 hover:text-red-800 p-2 rounded transition-colors" 
                                    disabled={deleteLoading === product.id}
                                    title="Deletar apenas este produto"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar o produto "{product.name}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                  <div className="flex gap-2 justify-end mt-4">
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteProduct(product)} 
                                      disabled={deleteLoading === product.id}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deleteLoading === product.id ? "Deletando..." : "Deletar"}
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Mensagens de feedback */}
                {deleteError && <div className="text-red-600 mt-2 text-sm">{deleteError}</div>}
                {deleteSuccess && <div className="text-green-600 mt-2 text-sm">{deleteSuccess}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
