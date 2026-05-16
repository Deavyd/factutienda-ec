import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PageInfoNote, useToast } from "../../components/ui";
import {
  useGeneralSettings,
  useHardwareSettings,
  usePingSri,
  useSriSettings,
  useUpdateGeneralSettings,
  useUpdateHardwareSettings,
  useUpdateSriSettings,
  useUploadBusinessLogo,
  useUploadSignature,
  useValidateSignature,
} from "../../hooks/useSettings";
import { GeneralSettingsTab, PrintersTab, SettingsTabs, SriSettingsTab } from "./components";

export default function EstablecimientosPage() {
  const { isDarkMode, toggleTheme } = useOutletContext();
  const { pushToast } = useToast();
  const { data: generalSettings } = useGeneralSettings();
  const { data: sriSettings } = useSriSettings();
  const { data: hardwareSettings } = useHardwareSettings();
  const pingSriMutation = usePingSri();
  const updateGeneralMutation = useUpdateGeneralSettings();
  const updateSriMutation = useUpdateSriSettings();
  const updateHardwareMutation = useUpdateHardwareSettings();
  const uploadLogoMutation = useUploadBusinessLogo();
  const uploadSignatureMutation = useUploadSignature();
  const validateSignatureMutation = useValidateSignature();
  const [activeTab, setActiveTab] = useState("general");
  const [sriStatus, setSriStatus] = useState("online");
  const [sigStatus, setSigStatus] = useState("idle");
  const [isSavingSri, setIsSavingSri] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingHardware, setIsSavingHardware] = useState(false);
  const [generalConfig, setGeneralConfig] = useState({
    businessName: "",
    phone: "",
    address: "",
    defaultVat: "15",
    logoUrl: "",
  });
  const [hardwareConfig, setHardwareConfig] = useState({
    printerName: "POS-80C (USB)",
    paperSize: "80mm",
    cashDrawerEnabled: true,
  });
  const [sriConfig, setSriConfig] = useState({
    ambiente: "PRUEBAS",
    ruc: "",
    establecimiento: "",
    puntoEmision: "",
    firmaNombre: "",
    signaturePassword: "",
    smtpHost: "",
    smtpPort: "",
    smtpSecure: true,
    smtpFrom: "",
    smtpPassword: "",
  });

  useEffect(() => {
    if (generalSettings) setGeneralConfig((prev) => ({ ...prev, ...generalSettings }));
  }, [generalSettings]);

  useEffect(() => {
    if (sriSettings) setSriConfig((prev) => ({ ...prev, ...sriSettings }));
  }, [sriSettings]);

  useEffect(() => {
    if (hardwareSettings) setHardwareConfig((prev) => ({ ...prev, ...hardwareSettings }));
  }, [hardwareSettings]);

  const checkSriConnection = async () => {
    setSriStatus("checking");
    try {
      const result = await pingSriMutation.mutateAsync();
      setSriStatus(result?.online ? "online" : "offline");
      pushToast({
        tone: result?.online ? "success" : "error",
        title: result?.online ? "Conexion SRI activa" : "SRI no disponible",
      });
    } catch {
      setSriStatus("offline");
      pushToast({ tone: "error", title: "Error al comprobar SRI" });
    }
  };

  const handleConfigChange = (field, value) => {
    setSriConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSri = async () => {
    setIsSavingSri(true);
    try {
      await updateSriMutation.mutateAsync(sriConfig);
      pushToast({ tone: "success", title: "Configuracion SRI guardada" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo guardar SRI" });
    } finally {
      setIsSavingSri(false);
    }
  };

  const handleGeneralChange = (field, value) => {
    setGeneralConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      await updateGeneralMutation.mutateAsync(generalConfig);
      pushToast({ tone: "success", title: "Configuracion general guardada" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo guardar configuracion general" });
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleUploadLogo = async (file) => {
    if (!file) return;
    try {
      const data = await uploadLogoMutation.mutateAsync(file);
      const logoUrl = data?.logoUrl || data?.url;
      if (logoUrl) handleGeneralChange("logoUrl", logoUrl);
      pushToast({ tone: "success", title: "Logo actualizado" });
    } catch {
      handleGeneralChange("logoUrl", URL.createObjectURL(file));
      pushToast({ tone: "info", title: "Logo cargado localmente" });
    }
  };

  const handleHardwareChange = (field, value) => {
    setHardwareConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveHardware = async () => {
    setIsSavingHardware(true);
    try {
      await updateHardwareMutation.mutateAsync(hardwareConfig);
      pushToast({ tone: "success", title: "Configuracion de hardware guardada" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo guardar hardware" });
    } finally {
      setIsSavingHardware(false);
    }
  };

  const handleSetDarkMode = (enabled) => {
    if (enabled !== isDarkMode) toggleTheme();
  };

  const validateSignature = async () => {
    setSigStatus("validating");
    try {
      const result = await validateSignatureMutation.mutateAsync({
        password: sriConfig.signaturePassword,
      });
      const isValid = Boolean(result?.valid ?? result?.valida);
      setSigStatus(isValid ? "valid" : "idle");
      pushToast({ tone: isValid ? "success" : "error", title: isValid ? "Firma valida" : "Firma invalida" });
    } catch {
      setSigStatus("idle");
      pushToast({ tone: "error", title: "No se pudo validar la firma" });
    }
  };

  const handleUploadSignature = async (file) => {
    if (!file) return;
    try {
      const data = await uploadSignatureMutation.mutateAsync(file);
      setSriConfig((prev) => ({ ...prev, firmaNombre: data?.fileName || data?.nombre || file.name }));
      pushToast({ tone: "success", title: "Firma cargada" });
    } catch {
      setSriConfig((prev) => ({ ...prev, firmaNombre: file.name }));
      pushToast({ tone: "info", title: "Firma cargada localmente" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row">
      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="min-h-[500px] flex-1 overflow-y-auto rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
        <PageInfoNote
          module={activeTab === "sri" ? "establecimientosSri" : activeTab === "printers" ? "establecimientosPrinters" : "establecimientosGeneral"}
          className="mb-6"
        />
        {activeTab === "general" ? (
          <GeneralSettingsTab
            isDarkMode={isDarkMode}
            setDarkMode={handleSetDarkMode}
            config={generalConfig}
            onChange={handleGeneralChange}
            onUploadLogo={handleUploadLogo}
            onSave={handleSaveGeneral}
            isSaving={isSavingGeneral}
          />
        ) : null}
        {activeTab === "sri" ? (
          <SriSettingsTab
            sriStatus={sriStatus}
            onCheckSri={checkSriConnection}
            config={sriConfig}
            onChangeConfig={handleConfigChange}
            onSave={handleSaveSri}
            isSaving={isSavingSri}
            sigStatus={sigStatus}
            onValidateSignature={validateSignature}
            onUploadSignature={handleUploadSignature}
          />
        ) : null}
        {activeTab === "printers" ? <PrintersTab config={hardwareConfig} onChange={handleHardwareChange} onSave={handleSaveHardware} isSaving={isSavingHardware} /> : null}
      </div>
    </div>
  );
}
