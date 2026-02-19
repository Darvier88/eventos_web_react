import React from 'react';

const TicketQuantitySelector = ({ qty, min, max, isFixed, onIncrement, onDecrement }) => {
  // If max is missing/zero, treat as large cap to allow incrementing
  const cap = max > 0 ? max : 9999;
  return (
    <div className="ticket-actions">
      <button onClick={onDecrement} disabled={isFixed || qty <= 0}>–</button>
      <span className="ticket-qty">{qty}</span>
      <button onClick={onIncrement} disabled={isFixed || qty >= cap}>+</button>
    </div>
  );
};

export default TicketQuantitySelector;