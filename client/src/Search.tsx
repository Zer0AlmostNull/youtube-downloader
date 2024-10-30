import React from 'react';
import { Input, Box, Flex, Button } from '@chakra-ui/react';
import { AppState } from './utils/helpers';

interface Props {
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  error: boolean;
  input: string;
  loadingState: AppState;
}
const Search = (props: Props) => {
  const { handleChange, handleSearch, error, input, loadingState } = props;

  const handleKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      handleSearch();
    }
  };
  return (
    <Box mt="2" mb="2">
      <Flex gridGap="2">
        {error &&
          <Input
            isInvalid={error}
            placeholder="Paste video link here..."
            onChange={handleChange}
            value={input}
            onKeyDown={handleKeydown}
          />
        }
        {!error &&
          <Input
            isInvalid={error}
            placeholder="Paste video link here..."
            onChange={handleChange}
            value={input}
            onKeyDown={handleKeydown}
          />
        }

        <Button
          onClick={handleSearch}
          isLoading={loadingState === AppState.RequestingMetadata || loadingState === AppState.DownloadingMetedata}
          loadingText={loadingState === AppState.RequestingMetadata?"Converting...":(loadingState===AppState.DownloadingMetedata?"Downloading Info...":"Search")}
        >
          Convert
        </Button>
      </Flex>
    </Box>
  );
};

export default React.memo(Search);
