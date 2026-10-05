export const getPriceForVotes = (voteCount: number) => {
  return {
    voteCount: voteCount,
    price: voteCount * 0.1, // USD 100 votes * 0.1 our weight = $10 USD
  };
};

export const getVotesForPrice = (price: number) => {
  return {
    voteCount: Math.floor(price / 0.1),
    price: price,
  };
};
