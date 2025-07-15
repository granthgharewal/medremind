import React from 'react';
import Stack from 'expo-router/stack';

const HistoryLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: 'white'},
        animation: 'slide_from_right',
      }}
    />
  );
};

export default HistoryLayout;
