
import { useState, useEffect } from 'react';
import { Banner, Expense, Coupon, Supplier, User, SearchLog, StockAlert, Subscription, ServiceBooking } from '../types';
import { 
    streamBanners, streamExpenses, streamCoupons, streamSuppliers, streamUsers, 
    streamSearchLogs, streamStockAlerts, streamSubscriptions, streamBookings,
    deleteBannerDB, deleteCouponDB, deleteSupplierDB, deleteSubscriptionDB,
    deleteStockAlertDB, deleteBlogPostDB, deleteUserDB, deleteSearchLogDB, deleteBookingDB,
    deleteOrderDB
} from '../services/db.ts';

export const useAdminData = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
    const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [bookings, setBookings] = useState<ServiceBooking[]>([]);

    useEffect(() => {
        const unsubs = [
            streamBanners(setBanners),
            streamExpenses(setExpenses),
            streamCoupons(setCoupons),
            streamSuppliers(setSuppliers),
            streamUsers(setUsers),
            streamSearchLogs(setSearchLogs),
            streamStockAlerts(setStockAlerts),
            streamSubscriptions(setSubscriptions),
            streamBookings(setBookings)
        ];
        return () => unsubs.forEach(unsub => unsub());
    }, []);

    const handleDeleteOrder = async (id: string) => { if(confirm("¿Borrar pedido?")) await deleteOrderDB(id); };
    const handleDeleteBanner = async (id: string) => { if(confirm("¿Borrar banner?")) await deleteBannerDB(id); };
    const handleDeleteCoupon = async (id: string) => { if(confirm("¿Borrar cupón?")) await deleteCouponDB(id); };
    const handleDeleteSupplier = async (id: string) => { if(confirm("¿Borrar proveedor?")) await deleteSupplierDB(id); };
    const handleDeleteSubscription = async (id: string) => { if(confirm("¿Cancelar suscripción?")) await deleteSubscriptionDB(id); };
    const handleDeleteStockAlert = async (id: string) => { if(confirm("¿Borrar alerta?")) await deleteStockAlertDB(id); };
    const handleDeleteBlogPost = async (id: string) => { if(confirm("¿Borrar consejo?")) await deleteBlogPostDB(id); };
    const handleDeleteUser = async (uid: string) => { if(confirm("¿Borrar permanentemente este usuario?")) await deleteUserDB(uid); };
    const handleDeleteSearchLog = async (id: string) => { await deleteSearchLogDB(id); };
    const handleDeleteBooking = async (id: string) => { if(confirm("¿Eliminar esta cita?")) await deleteBookingDB(id); };

    return {
        banners, expenses, coupons, suppliers, users, searchLogs, stockAlerts, subscriptions, bookings,
        handleDeleteOrder, handleDeleteBanner, handleDeleteCoupon, handleDeleteSupplier, 
        handleDeleteSubscription, handleDeleteStockAlert, handleDeleteBlogPost, 
        handleDeleteUser, handleDeleteSearchLog, handleDeleteBooking
    };
};
