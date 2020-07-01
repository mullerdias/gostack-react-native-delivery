import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import api from '../../services/api';
import formatValue from '../../utils/formatValue';

import {
  Container,
  Header,
  HeaderTitle,
  FoodsContainer,
  FoodList,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
} from './styles';

type RootStackParamList = {
  Orders: { orderId?: number };
};

type Props = StackScreenProps<RootStackParamList, 'Orders'>;

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  formattedPrice: string;
  thumbnail_url: string;
}

const Orders: React.FC<Props> = ({ route }) => {
  const [orders, setOrders] = useState<Food[]>([]);

  const orderId = route?.params?.orderId;

  useEffect(() => {
    async function loadOrders(): Promise<void> {
      const response = await api.get<Food[]>('orders');

      const newFoods = response.data.map(food => ({
        ...food,
        formattedPrice: formatValue(food.price),
      }));

      setOrders(newFoods);
    }

    loadOrders();
  }, [orderId]);

  return (
    <Container>
      <Header>
        <HeaderTitle>Meus pedidos</HeaderTitle>
      </Header>

      <FoodsContainer>
        <FoodList
          data={orders}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <Food key={item.id} activeOpacity={0.6}>
              <FoodImageContainer>
                <Image
                  style={{ width: 88, height: 88 }}
                  source={{ uri: item.thumbnail_url }}
                />
              </FoodImageContainer>
              <FoodContent>
                <FoodTitle>{item.name}</FoodTitle>
                <FoodDescription>{item.description}</FoodDescription>
                <FoodPricing>{item.formattedPrice}</FoodPricing>
              </FoodContent>
            </Food>
          )}
        />
      </FoodsContainer>
    </Container>
  );
};

export default Orders;
