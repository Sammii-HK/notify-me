import ReviewClient from './ReviewClient';

interface PageProps {
  params: { postSetId: string }
}

export default function ReviewPage({ params }: PageProps) {
  return <ReviewClient postSetId={params.postSetId} />;
}
