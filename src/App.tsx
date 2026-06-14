import { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  Stack,
  Image,
  Text,
  Badge,
  Center,
  WrapItem,
  Wrap,
  useToast,
} from '@chakra-ui/react';

interface PokemonType {
  type: {
    name: string;
  };
}

interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
  };
  types: PokemonType[];
  stats: PokemonStat[];
}

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [capturedPokemon, setCapturedPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const searchPokemon = async () => {
    if (!searchInput.trim()) {
      toast({
        title: 'Please enter a Pokemon name or ID',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/pokemon/${searchInput.toLowerCase()}`
      );

      if (!response.ok) {
        throw new Error('Pokemon not found');
      }

      const data: Pokemon = await response.json();
      setCurrentPokemon(data);
    } catch (error) {
      toast({
        title: 'Pokemon not found',
        description: 'Please try another name or ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setCurrentPokemon(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPokemon();
    }
  };

  const capturePokemon = () => {
    if (!currentPokemon) return;

    if (capturedPokemon.length >= 6) {
      toast({
        title: 'Party is full!',
        description: 'You can only capture up to 6 Pokemon',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCapturedPokemon([...capturedPokemon, currentPokemon]);
    toast({
      title: `${currentPokemon.name} captured!`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const releasePokemon = (index: number) => {
    const released = capturedPokemon[index];
    setCapturedPokemon(capturedPokemon.filter((_, i) => i !== index));
    toast({
      title: `${released.name} released`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const getStat = (statName: string) => {
    return currentPokemon?.stats.find(
      (s) => s.stat.name === statName
    )?.base_stat || 0;
  };

  return (
    <Center h='100vh' p={4}>
      <Box w='full' maxWidth='600px'>
        <Stack flexDir='row' spacing={0}>
          <Stack
            borderWidth={6}
            rounded='xl'
            borderColor='red.800'
            p={4}
            bg='#CE302A'
          >
            <HStack>
              <Input
                data-testid="search-input"
                borderWidth={4}
                borderColor='red.800'
                bg='white'
                placeholder='name/id'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                data-testid="search-button"
                borderWidth={4}
                borderColor='red.800'
                onClick={searchPokemon}
                isLoading={isLoading}
              >
                Search
              </Button>
            </HStack>
            {currentPokemon ? (
              <Stack direction='row' spacing={4} data-testid="pokemon-card">
                <Box>
                  <Box bg='gray.100' rounded='lg'>
                    <Image
                      data-testid="pokemon-image"
                      src={currentPokemon.sprites.front_default}
                      alt={currentPokemon.name}
                    />
                  </Box>
                </Box>
                <Stack>
                  <Text data-testid="pokemon-name" color='white' fontSize='xl' fontWeight={600} textTransform='capitalize'>
                    {currentPokemon.name}
                  </Text>
                  <Text data-testid="pokemon-id" color='white' fontSize='md' fontWeight={600}>
                    #{currentPokemon.id}
                  </Text>
                  <Text color='white'>Type</Text>
                  <Box>
                    <Wrap>
                      {currentPokemon.types.map((type, index) => (
                        <WrapItem key={index}>
                          <Badge data-testid={`pokemon-type-${index}`} borderWidth={3} rounded='md' borderColor='red.800' textTransform='capitalize'>
                            {type.type.name}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                  <HStack color='white'>
                    <Stack>
                      <Text>HP</Text>
                      <Text data-testid="stat-hp">{getStat('hp')}</Text>
                    </Stack>
                    <Stack>
                      <Text>Attack</Text>
                      <Text data-testid="stat-attack">{getStat('attack')}</Text>
                    </Stack>
                    <Stack>
                      <Text>Defense</Text>
                      <Text data-testid="stat-defense">{getStat('defense')}</Text>
                    </Stack>
                    <Stack>
                      <Text>Speed</Text>
                      <Text data-testid="stat-speed">{getStat('speed')}</Text>
                    </Stack>
                  </HStack>
                  <Box>
                    <Button
                      data-testid="capture-button"
                      w='full'
                      borderWidth={4}
                      borderColor='red.800'
                      onClick={capturePokemon}
                      isDisabled={capturedPokemon.length >= 6}
                    >
                      Capture
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            ) : (
              <Center py={8}>
                <Text color='white' fontSize='lg'>
                  Search for a Pokemon to begin
                </Text>
              </Center>
            )}
          </Stack>
          <Stack
            data-testid="captured-list"
            data-count={capturedPokemon.length}
            borderWidth={6}
            rounded='xl'
            borderColor='red.800'
            p={4}
            bg='#CE302A'
            spacing={2}
            pos='relative'
            left='-4px'
            minW='150px'
          >
            {capturedPokemon.length === 0 ? (
              <Center h='100px'>
                <Text data-testid="empty-captured-message" color='white' fontSize='sm' textAlign='center'>
                  Captured Pokemon will appear here
                </Text>
              </Center>
            ) : (
              capturedPokemon.map((pokemon, index) => (
                <Box
                  key={index}
                  data-testid={`captured-pokemon-${index}`}
                  data-pokemon-name={pokemon.name}
                  bg='gray.100'
                  rounded='lg'
                  cursor='pointer'
                  onClick={() => releasePokemon(index)}
                  _hover={{ opacity: 0.7 }}
                  title={`Click to release ${pokemon.name}`}
                >
                  <Image
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                  />
                </Box>
              ))
            )}
          </Stack>
        </Stack>
      </Box>
    </Center>
  );
}

export default App;
