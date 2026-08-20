import CaseWizard from './CaseWizard';

export default function NewCasePage() {
  return (
    <div className="min-h-screen bg-surface-container-lowest p-8">
      <h1 className="text-3xl font-bold text-center mb-8">CASE 입력 마법사</h1>
      <CaseWizard />
    </div>
  );
}
