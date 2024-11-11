import ConvertBox from './ConvertBox';
import ConvertBoxSkeleton from './ConvertBoxSkeleton';
import { AppState, FormatType } from './utils/helpers';

interface Props {
  data: any;
  loadingState: AppState;
  chooseFormat: (format: FormatType, videoMetadata: any) => void;
}
export default function PreviewBox(props: Props) {
  const { loadingState, data, chooseFormat } = props;
  if (loadingState == AppState.DownloadingMetedata || 
      loadingState == AppState.RequestingMetadata)
    {
    return <ConvertBoxSkeleton />;
  }
  if (!data) {
    return <></>;
  }
  return <ConvertBox data={data} chooseFormat={chooseFormat} />;
}
