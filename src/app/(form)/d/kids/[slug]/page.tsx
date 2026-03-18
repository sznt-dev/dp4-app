import { createClient } from '@/lib/supabase/server';
import KidsFormFlow from './KidsFormFlow';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function KidsFormPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Look up dentist by slug
  const { data: dentist } = await supabase
    .from('dp4_dentists')
    .select('id, name, clinic_name, unique_slug')
    .eq('unique_slug', slug)
    .eq('is_active', true)
    .single();

  if (!dentist) {
    return (
      <div className="min-h-screen bg-[#07070C] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold text-foreground">Link inválido</h1>
          <p className="text-foreground/60">Este link não está ativo ou não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <KidsFormFlow
      slug={slug}
      dentistId={dentist.id}
      dentistName={dentist.name}
    />
  );
}
