import React from 'react';
import { Input, Box, Flex, Button} from '@chakra-ui/react';
import { Field } from "@/components/ui/field"

interface Props {
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  error: boolean;
  input: string;
  isLoading: boolean;
}
const Search = (props: Props) => {
  const { handleChange, handleSearch, error, input, isLoading } = props;

  const handleKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      handleSearch();
    }
  };
  return (
    <Box mt="2" mb="2">
      <Flex gridGap="2">
        {error && <Field invalid errorText="This field is required">
          <Input
            isInvalid={error}
            placeholder="Paste video link here..."
            onChange={handleChange}
            value={input}
            onKeyDown={handleKeydown}
          />
        </Field>}
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
          isLoading={isLoading}
          loadingText="Converting..."
        >
          Convert
        </Button>
      </Flex>
    </Box>
  );
};

export default React.memo(Search);
