import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { Portal, Snackbar } from "react-native-paper";
const Context = createContext<(message: string) => void>(() => undefined);
export function SnackbarProvider({ children }: PropsWithChildren) { const [message, setMessage] = useState(""); const value = useMemo(() => (text: string) => setMessage(text), []); return <Context.Provider value={value}>{children}<Portal><Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={3000}>{message}</Snackbar></Portal></Context.Provider>; }
export const useNotice = () => useContext(Context);
