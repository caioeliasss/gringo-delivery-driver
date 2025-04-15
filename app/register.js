// app/register.js
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { TextInput, Button, Text, Surface, Snackbar } from "react-native-paper";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInputMask } from "react-native-masked-text";
import { StatusBar } from "expo-status-bar";
import { createMotoboy } from "./services/api";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const { register } = useAuth();
  const router = useRouter();

  // Função para validar CPF - implementação simples
  const validateCPF = (cpf) => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/[^\d]/g, "");

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    // Validação simplificada - em uma aplicação real você usaria uma biblioteca de validação
    return true;
  };

  // Função para validar número de telefone - implementação simples
  const validatePhoneNumber = (phone) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/[^\d]/g, "");

    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    return cleanPhone.length >= 10;
  };

  const handleRegister = async () => {
    // Validação dos campos
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber ||
      !cpf
    ) {
      setError("Por favor, preencha todos os campos");
      setVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setVisible(true);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setVisible(true);
      return;
    }

    if (!validateCPF(cpf)) {
      setError("CPF inválido");
      setVisible(true);
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Número de telefone inválido");
      setVisible(true);
      return;
    }

    setLoading(true);
    try {
      // Remove máscaras dos campos
      const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
      const cleanCPF = cpf.replace(/[^\d]/g, "");
      const userCredential = await register(email, password);

      // Obtém o UID do usuário recém-criado
      const firebaseUid = userCredential.uid;

      const motoboyData = {
        email: email,
        phoneNumber: cleanPhoneNumber,
        cpf: cleanCPF,
        name: name,
        firebaseUid: firebaseUid,
      };

      await createMotoboy(motoboyData);

      router.replace("/(tabs)");
    } catch (error) {
      let errorMessage = "Erro ao registrar. Tente novamente.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "O email fornecido é inválido.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca.";
      }

      setError(errorMessage);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Componente personalizado para input com máscara
  const MaskedTextInput = ({ label, value, onChangeText, mask, ...rest }) => (
    <TextInput
      label={label}
      value={value}
      mode="outlined"
      style={styles.input}
      render={(props) => (
        <TextInputMask
          {...props}
          type={mask}
          value={value}
          onChangeText={onChangeText}
        />
      )}
      {...rest}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/gringo-logo.png")}
              style={styles.logo}
            />
          </View>

          <Surface style={styles.surface}>
            <Text variant="headlineMedium" style={styles.title}>
              Criar Conta
            </Text>

            <TextInput
              label="Nome Completo"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="CPF"
              value={cpf}
              onChangeText={setCpf}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Celular"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              mode="outlined"
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? "eye" : "eye-off"}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
              style={styles.input}
            />

            <TextInput
              label="Confirmar Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureTextEntry}
              mode="outlined"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Cadastrar
            </Button>

            <View style={styles.loginContainer}>
              <Text>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        action={{
          label: "Fechar",
          onPress: () => setVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EB2E3E", // Main red background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 80,
  },
  surface: {
    padding: 20,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: "#FFFFFF",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    color: "#EB2E3E", // Red text for the title
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: "#EB2E3E", // Red button
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginLink: {
    color: "#EB2E3E", // Red link text
    fontWeight: "bold",
  },
});
