import ConvertBox from './ConvertBox';
import ConvertBoxSkeleton from './ConvertBoxSkeleton';
import { FormatType } from './utils/helpers';

interface Props {
  data: any;
  isLoading: boolean;
  chooseFormat: (format: FormatType, videoMetadata: any) => void;
}
export default function PreviewBox(props: Props) {
  const { isLoading, data, chooseFormat } = props;
  if (isLoading) {
    return <ConvertBoxSkeleton />;
  }
  if (!data) {
    return <></>;
  }
  return <ConvertBox data={data} chooseFormat={chooseFormat} />;
}
