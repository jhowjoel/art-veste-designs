-- Limpar categorias antigas e criar novas para caixas de papelão
DELETE FROM categories;

-- Inserir novas categorias principais para caixas de papelão
INSERT INTO categories (id, name, description, icon, parent_id) VALUES
-- Categorias principais
('550e8400-e29b-41d4-a716-446655440001', 'Caixas de Presente', 'Caixas elegantes para presentes e embalagens especiais', 'Gift', NULL),
('550e8400-e29b-41d4-a716-446655440002', 'Lembrancinhas', 'Caixinhas pequenas para lembrancinhas e souvenirs', 'Heart', NULL),
('550e8400-e29b-41d4-a716-446655440003', 'Envelopes', 'Envelopes e porta-cartões personalizados', 'Mail', NULL),
('550e8400-e29b-41d4-a716-446655440004', 'Cases e Organizadores', 'Cases para celular, notebooks e organizadores', 'Briefcase', NULL),

-- Subcategorias para tipos de papel (Caixas de Presente)
('550e8400-e29b-41d4-a716-446655440011', 'Papelão Paraná', 'Papelão cinza rígido, ideal para bases estruturadas', 'Box', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440012', 'Papel Duplex', 'Um lado branco para impressão, outro cinza', 'Layers', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440013', 'Papel Triplex', 'Mais rígido que duplex, ideal para caixas premium', 'Package', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440014', 'Cartão Couché', 'Papel brilhante ou fosco, para caixas luxuosas', 'Sparkles', '550e8400-e29b-41d4-a716-446655440001'),

-- Subcategorias para lembrancinhas
('550e8400-e29b-41d4-a716-446655440021', 'Cartolina', 'Papel econômico para lembrancinhas', 'Smile', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440022', 'Papel Kraft', 'Papel resistente e rústico para embalagens artesanais', 'TreePine', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440023', 'Papel Offset', 'Papel fosco, fácil de imprimir', 'FileText', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440024', 'Color Plus', 'Papel colorido na massa para projetos decorativos', 'Palette', '550e8400-e29b-41d4-a716-446655440002'),

-- Subcategorias para envelopes
('550e8400-e29b-41d4-a716-446655440031', 'Papel Vergê', 'Papel elegante com textura fina', 'ScrollText', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440032', 'Kraft Liso', 'Papel kraft liso, rústico e resistente', 'FileImage', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440033', 'Papel Sulfite', 'Para envelopes mais simples e econômicos', 'File', '550e8400-e29b-41d4-a716-446655440003'),

-- Subcategorias para papéis especiais
('550e8400-e29b-41d4-a716-446655440041', 'Papel Metalizado', 'Acabamento dourado, prateado ou holográfico', 'Star', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440042', 'Papel Perolado', 'Acabamento brilhante e suave', 'Gem', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440043', 'Papel Vegetal', 'Papel translúcido para detalhes especiais', 'Eye', '550e8400-e29b-41d4-a716-446655440004');