import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get<Food>(`foods/${routeParams.id}`);

      const newFood = response.data;

      newFood.price = Number(newFood.price);
      newFood.formattedPrice = formatValue(newFood.price);

      newFood.extras = newFood.extras.map(extra => ({
        ...extra,
        value: Number(extra.value),
        quantity: 0,
      }));

      setFood(newFood);
      setExtras(newFood.extras);
    }

    async function loadIsFavorite(): Promise<void> {
      const response = await api.get(`favorites`, {
        params: {
          id: routeParams.id,
        },
      });

      setIsFavorite(!!response.data[0]);
    }

    loadFood();
    loadIsFavorite();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    setExtras(state =>
      state.map(extra => {
        if (extra.id === id) {
          return { ...extra, quantity: extra.quantity + 1 };
        }
        return extra;
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(state =>
      state.map(extra => {
        if (extra.id === id && extra.quantity > 0) {
          return { ...extra, quantity: extra.quantity - 1 };
        }
        return extra;
      }),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(prevQuantity => prevQuantity + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(prevQuantity => (prevQuantity > 1 ? prevQuantity - 1 : 1));
  }

  const toggleFavorite = useCallback(async () => {
    const isFavoriteNewValue = !isFavorite;
    const {
      id,
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
    } = food;

    setIsFavorite(isFavoriteNewValue);

    if (isFavoriteNewValue) {
      await api.post('favorites', {
        id,
        name,
        description,
        price,
        category,
        image_url,
        thumbnail_url,
      });
    } else {
      await api.delete(`favorites/${id}`);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const priceExtras = extras.reduce((result, extra) => {
      return extra.quantity * extra.value + result;
    }, 0);

    const total = foodQuantity * (food.price + priceExtras);

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const { id: product_id, name, description, category, thumbnail_url } = food;

    const priceExtras = extras.reduce((result, extra) => {
      return extra.quantity * extra.value + result;
    }, 0);

    const total = foodQuantity * (food.price + priceExtras);

    const response = await api.post('orders', {
      product_id,
      name,
      description,
      price: total,
      quantity: foodQuantity,
      category,
      thumbnail_url,
      extras: extras.filter(extra => extra.quantity > 0),
    });

    navigation.navigate('MainBottom', {
      screen: 'Orders',
      params: {
        orderId: response.data.id,
      },
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
