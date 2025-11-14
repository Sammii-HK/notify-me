import AccountEditorClient from './AccountEditorClient';

interface PageProps {
  params: Promise<{ accountId: string }>
}

export default async function AccountPage({ params }: PageProps) {
  const { accountId } = await params;
  return <AccountEditorClient accountId={accountId} />;
}



