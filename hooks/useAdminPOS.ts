
import { useState } from 'react';
import { Product, CartItem, User, Order, POINTS_DISCOUNT_VALUE } from '../types';
import { addOrderDB, updateStockDB } from '../services/db.ts';

export const useAdminPOS = (products: Product[]) => {
    const [posCart, setPosCart] = useState<CartItem[]>([]);
    const [posSearch, setPosSearch] = useState('');
    const [posCashReceived, setPosCashReceived] = useState('');
    const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
    const [showPosScanner, setShowPosScanner] = useState(false);
    const [showCashClosure, setShowCashClosure] = useState(false);

    const addToPosCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
        const unitsNeeded = unitType === 'BOX' ? (product.unitsPerBox || 1) : 1;
        const currentTotalInCart = posCart
            .filter(item => item.id === product.id)
            .reduce((sum, item) => {
                const itemUnits = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
                return sum + (item.quantity * itemUnits);
            }, 0);

        if (currentTotalInCart + unitsNeeded > product.stock) {
            return alert(`Stock insuficiente. Disponible: ${product.stock}`);
        }
        
        setPosCart(prev => {
            const exists = prev.find(item => item.id === product.id && item.selectedUnit === unitType);
            if (exists) {
                return prev.map(item => (item.id === product.id && item.selectedUnit === unitType) 
                    ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
        });
    };

    const handlePosCheckout = async (customer?: User, pointsRedeemed: number = 0) => {
        if (posCart.length === 0) return;
        
        const subtotalValue = posCart.reduce((sum, item) => {
            const isBox = item.selectedUnit === 'BOX';
            const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
            return sum + (price * item.quantity);
        }, 0);

        const discountValue = pointsRedeemed > 0 ? POINTS_DISCOUNT_VALUE : 0;
        const totalValue = Math.max(0, subtotalValue - discountValue);

        const orderData: Order = {
            id: `POS-${Date.now()}`,
            customerName: customer?.displayName || 'Venta Local',
            customerPhone: customer?.phone || 'N/A',
            customerAddress: customer?.cedula || 'Mostrador',
            items: posCart, subtotal: subtotalValue, deliveryFee: 0,
            discount: discountValue, pointsRedeemed: pointsRedeemed,
            total: totalValue, paymentMethod: posPaymentMethod,
            status: 'DELIVERED', source: 'POS', date: new Date().toISOString(),
            userId: customer?.uid
        };

        if (posCashReceived && !isNaN(parseFloat(posCashReceived))) orderData.cashGiven = parseFloat(posCashReceived);

        try {
            await addOrderDB(orderData);
            for (const item of posCart) {
                const orig = products.find(p => p.id === item.id);
                if (orig) {
                    const isBox = item.selectedUnit === 'BOX';
                    const unitsToSubtract = isBox ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
                    await updateStockDB(item.id, Math.max(0, orig.stock - unitsToSubtract));
                }
            }
            setPosCart([]); setPosCashReceived(''); alert("¡Venta exitosa!");
        } catch (error: any) { alert("Error al procesar venta."); }
    };

    return {
        posCart, setPosCart, posSearch, setPosSearch, posCashReceived, setPosCashReceived,
        posPaymentMethod, setPosPaymentMethod, showPosScanner, setShowPosScanner,
        showCashClosure, setShowCashClosure, addToPosCart, handlePosCheckout
    };
};
