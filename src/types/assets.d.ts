// Tipagem para imports de imagens (Expo/Metro resolve em runtime).
declare module '*.png' {
  const source: import('react-native').ImageSourcePropType;
  export default source;
}

declare module '*.jpg' {
  const source: import('react-native').ImageSourcePropType;
  export default source;
}

declare module '*.jpeg' {
  const source: import('react-native').ImageSourcePropType;
  export default source;
}
