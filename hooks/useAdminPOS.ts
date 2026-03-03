
import { useState } from 'react';
import { Product, CartItem, User, Order, POINTS_DISCOUNT_VALUE, Bundle } from '../types';
import { addOrderDB } from '../services/db.orders';
import { updateStockDB } from '../services/db.products';
import { saveUserDB } from '../services/db.users';

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

    const addBundleToPosCart = (bundle: Bundle) => {
        // Verificar stock de todos los productos del combo
        for (const pid of bundle.productIds) {
            const p = products.find(x => x.id === pid);
            if (!p || p.stock <= 0) return alert(`El producto ${p?.name || pid} no tiene stock para este combo.`);
        }

        // Para simplificar el cálculo de totales y stock, agregamos los productos individualmente
        // pero aplicamos el descuento del combo al total de la orden.
        // O mejor, creamos un "item virtual" que represente el combo.
        
        // Vamos a agregarlos como items individuales pero con precio 0, 
        // y agregamos un item "COMBO" con el precio total del combo.
        // O simplemente agregamos los productos y calculamos la diferencia de precio como descuento.
        
        const individualTotal = bundle.productIds.reduce((sum, pid) => {
            const p = products.find(x => x.id === pid);
            return sum + (p?.price || 0);
        }, 0);
        
        const bundleDiscount = individualTotal - bundle.price;

        setPosCart(prev => {
            let newCart = [...prev];
            bundle.productIds.forEach(pid => {
                const p = products.find(x => x.id === pid);
                if (p) {
                    const exists = newCart.find(item => item.id === p.id && item.selectedUnit === 'UNIT');
                    if (exists) {
                        newCart = newCart.map(item => (item.id === p.id && item.selectedUnit === 'UNIT') 
                            ? { ...item, quantity: item.quantity + 1 } : item
                        );
                    } else {
                        newCart.push({ ...p, quantity: 1, selectedUnit: 'UNIT' });
                    }
                }
            });

            if (bundleDiscount > 0) {
                const discountId = `discount-${bundle.id}`;
                const exists = newCart.find(item => item.id === discountId);
                if (exists) {
                    newCart = newCart.map(item => item.id === discountId ? { ...item, quantity: item.quantity + 1 } : item);
                } else {
                    newCart.push({
                        id: discountId,
                        name: `Ahorro: ${bundle.name}`,
                        description: 'Descuento por combo',
                        price: -bundleDiscount,
                        image: 'https://cdn-icons-png.flaticon.com/512/726/726476.png',
                        category: 'Descuento',
                        stock: 9999,
                        quantity: 1,
                        selectedUnit: 'UNIT'
                    } as CartItem);
                }
            }
            return newCart;
        });

        alert(`Combo "${bundle.name}" agregado.`);
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

            // Actualizar puntos y gasto acumulado del cliente
            if (customer) {
                const totalSpend = (customer.accumulatedSpend || 0) + subtotalValue;
                const newPointsEarned = Math.floor(totalSpend);
                const remainingSpend = totalSpend - newPointsEarned;
                
                const updatedUser: User = {
                    ...customer,
                    points: (customer.points - pointsRedeemed) + newPointsEarned,
                    accumulatedSpend: remainingSpend
                };
                await saveUserDB(updatedUser);
            }

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
        showCashClosure, setShowCashClosure, addToPosCart, addBundleToPosCart, handlePosCheckout
    };
};
