-- Adicionar campo parent_id para suporte a subcategorias
ALTER TABLE public.categories 
ADD COLUMN parent_id UUID REFERENCES public.categories(id);

-- Inserir subcategorias da categoria "Vetor"
INSERT INTO public.categories (name, description, icon, parent_id) 
VALUES 
  ('Cesta', 'Arquivos SVG de cestas', 'ShoppingBasket', (SELECT id FROM categories WHERE name = 'Vetor')),
  ('Caixinhas', 'Arquivos SVG de caixinhas', 'Package', (SELECT id FROM categories WHERE name = 'Vetor')),
  ('Masculino', 'Arquivos SVG masculinos', 'User', (SELECT id FROM categories WHERE name = 'Vetor')),
  ('Feminino', 'Arquivos SVG femininos', 'UserCheck', (SELECT id FROM categories WHERE name = 'Vetor')),
  ('Meninas', 'Arquivos SVG para meninas', 'Heart', (SELECT id FROM categories WHERE name = 'Vetor')),
  ('Meninos', 'Arquivos SVG para meninos', 'Zap', (SELECT id FROM categories WHERE name = 'Vetor'));