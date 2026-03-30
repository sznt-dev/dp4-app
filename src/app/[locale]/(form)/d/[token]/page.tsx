import { createClient } from '@/lib/supabase/server';
import FormFlow from './FormFlow';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function FormPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // 1. Check if token is a control link (tied to specific patient)
  const { data: link } = await supabase
    .from('dp4_links')
    .select('id, patient_id, link_type, parent_submission_id, is_used')
    .eq('token', token)
    .single();

  if (link && link.link_type === 'control' && link.patient_id) {
    // Get the patient's name and CPF to pre-fill and lock
    const { data: patient } = await supabase
      .from('dp4_patients')
      .select('id, name, cpf, dentist_id')
      .eq('id', link.patient_id)
      .single();

    if (patient) {
      return (
        <FormFlow
          token={token}
          dentistId={patient.dentist_id || undefined}
          isControl={true}
          lockedPatient={{
            id: patient.id,
            name: patient.name,
            cpf: patient.cpf,
          }}
          parentSubmissionId={link.parent_submission_id || undefined}
        />
      );
    }
  }

  // 2. Check if token is a dentist slug (permanent link)
  const { data: dentist } = await supabase
    .from('dp4_dentists')
    .select('id, name, clinic_name, unique_slug')
    .eq('unique_slug', token)
    .eq('is_active', true)
    .single();

  if (dentist) {
    return <FormFlow token={token} dentistId={dentist.id} dentistName={dentist.name} />;
  }

  // 3. Regular token — render form directly
  return <FormFlow token={token} />;
}
