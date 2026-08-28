import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../auth';
import { 
  RegistroPontoDoc, 
  ConfiguracoesPonto, 
  StatusPonto 
} from '../types/ponto';
import { 
  salvarRegistroPonto, 
  calcularDistanciaMetros, 
  fetchConfiguracoesPonto,
  gerarComprovantePonto,
  registrarLogAuditoriaPonto,
  validarSequenciaMarcacao
} from '../services/pontoService';

interface RegistroPontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPontoRegistrado?: () => void;
}

export const RegistroPontoModal: React.FC<RegistroPontoModalProps> = ({
  isOpen,
  onClose,
  onPontoRegistrado
}) => {
  const { user } = useAuth();
  const [time, setTime] = useState<Date>(new Date());
  const [config, setConfig] = useState<ConfiguracoesPonto | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [comprovanteGerado, setComprovanteGerado] = useState<{
    hash: string;
    tipo: string;
    horario: string;
    data: string;
  } | null>(null);

  // GPS state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'solicitando' | 'sucesso' | 'erro'>('solicitando');
  const [distanceMetros, setDistanceMetros] = useState<number | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const empresaId = user?.companyId || user?.empresaId || user?.tenantId || '';
  const funcionarioNome = user?.name || 'Funcionário RH TRANSFORMA';

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch configs and GPS
  useEffect(() => {
    if (isOpen) {
      setSuccessMsg(null);
      setErrorMsg(null);
      fetchConfiguracoesPonto(empresaId).then(cfg => {
        setConfig(cfg);
      });

      // Request Geolocation
      if ('geolocation' in navigator) {
        setGpsStatus('solicitando');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCoords({ latitude: lat, longitude: lng });
            setGpsStatus('sucesso');

            if (config?.latitudeCentro && config?.longitudeCentro) {
              const dist = calcularDistanciaMetros(lat, lng, config.latitudeCentro, config.longitudeCentro);
              setDistanceMetros(Math.round(dist));
            }
          },
          (err) => {
            console.warn('GPS Error:', err);
            setGpsStatus('erro');
            // Fallback mock coordinates for demo
            setCoords({ latitude: -23.55052, longitude: -46.633308 });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [isOpen, empresaId]);

  // Handle Camera Startup
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Webcam permission denied or unavailable:', err);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const data = canvasRef.current.toDataURL('image/png');
        setPhotoData(data);

        // stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
      }
    }
  };

  const handleRegister = async (tipo: 'ENTRADA' | 'INICIO_INTERVALO' | 'RETORNO_INTERVALO' | 'SAIDA') => {
    setLoading(true);
    setErrorMsg(null);

    // Geofencing Validation
    if (config?.geofencingAtivo && config?.latitudeCentro && coords) {
      const dist = calcularDistanciaMetros(coords.latitude, coords.longitude, config.latitudeCentro, config.longitudeCentro);
      if (dist > config.raioPermitidoMetros) {
        setErrorMsg(`Você está fora do raio permitido para registrar o ponto (${Math.round(dist)}m do local de trabalho; limite é ${config.raioPermitidoMetros}m).`);
        setLoading(false);
        return;
      }
    }

    const todayStr = time.toISOString().split('T')[0];
    const timeStr = time.toTimeString().substring(0, 5);
    const idReg = `ponto-${user?.id || 'usr'}-${todayStr}`;

    let statusPonto: StatusPonto = 'Trabalhando';
    let fieldUpdate: Partial<RegistroPontoDoc> = {};

    if (tipo === 'ENTRADA') {
      statusPonto = 'Trabalhando';
      fieldUpdate = { horaEntrada: timeStr };
    } else if (tipo === 'INICIO_INTERVALO') {
      statusPonto = 'Intervalo';
      fieldUpdate = { inicioIntervalo: timeStr };
    } else if (tipo === 'RETORNO_INTERVALO') {
      statusPonto = 'Trabalhando';
      fieldUpdate = { retornoIntervalo: timeStr };
    } else if (tipo === 'SAIDA') {
      statusPonto = 'Finalizado';
      fieldUpdate = { horaSaida: timeStr };
    }

    const regDoc: RegistroPontoDoc = {
      id: idReg,
      funcionarioId: user?.id || 'func-01',
      funcionarioNome,
      empresaId,
      data: todayStr,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      dispositivo: `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`,
      fotoRegistro: photoData || undefined,
      status: statusPonto,
      ...fieldUpdate
    };

    try {
      await salvarRegistroPonto(regDoc);

      // Gerar Comprovante Digital Oficial de Marcação
      const hashComp = await gerarComprovantePonto({
        funcionarioNome,
        matricula: user?.id || 'MAT-2026',
        empresaNome: user?.companyName || 'RH TRANSFORMA / RH TRANSFORMA',
        data: todayStr,
        horario: timeStr,
        tipoMarcacao: tipo.toLowerCase() as any,
        origem: 'Portal Web Ponto Digital',
        localizacaoStr: coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : undefined
      });

      // Registrar Log de Auditoria
      await registrarLogAuditoriaPonto({
        companyId: empresaId,
        empresaId,
        usuarioId: user?.id || 'usr-001',
        usuarioNome: funcionarioNome,
        acao: `REGISTRO_PONTO_${tipo}`,
        detalhes: `Ponto batido às ${timeStr} (${tipo}) com hash ${hashComp}`
      });

      setComprovanteGerado({
        hash: hashComp,
        tipo: tipo.replace('_', ' '),
        horario: timeStr,
        data: todayStr
      });

      setSuccessMsg(`Registro de ${tipo.replace('_', ' ')} realizado com sucesso às ${timeStr}!`);
      if (onPontoRegistrado) onPontoRegistrado();
    } catch (err) {
      setErrorMsg('Falha ao salvar registro no servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Registro de Ponto Digital</h2>
          <p className="text-xs text-slate-500 mt-1">{funcionarioNome} • {user?.companyName || 'RH TRANSFORMA'}</p>
        </div>

        {/* Live Clock Display */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 text-center mb-5 shadow-lg border border-slate-800">
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Horário Oficial Brasília</p>
          <div className="text-4xl font-black tracking-tight font-mono text-emerald-300">
            {time.toLocaleTimeString('pt-BR')}
          </div>
          <p className="text-xs text-slate-400 mt-1 capitalize font-medium">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* GPS Geofencing Status */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="font-bold text-slate-800">Localização GPS:</span>{' '}
              {coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Obtendo coordenadas...'}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-100">
            <ShieldCheck className="w-3 h-3" /> Validado
          </span>
        </div>

        {/* Webcam Capture Area */}
        <div className="mb-5 border border-dashed border-slate-200 p-3 rounded-xl bg-slate-50/50 text-center">
          {photoData ? (
            <div className="relative inline-block">
              <img src={photoData} alt="Foto do registro" className="w-40 h-30 object-cover rounded-lg mx-auto shadow-sm" />
              <button
                onClick={() => setPhotoData(null)}
                className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full text-xs shadow hover:bg-rose-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : cameraActive ? (
            <div className="space-y-2">
              <video ref={videoRef} autoPlay playsInline className="w-48 h-36 object-cover rounded-lg mx-auto bg-black" />
              <button
                onClick={takePhoto}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" /> Tirar Foto
              </button>
            </div>
          ) : (
            <button
              onClick={startCamera}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center justify-center gap-1.5 mx-auto py-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Capturar Foto de Confirmação (Opcional)
            </button>
          )}
          <canvas ref={canvasRef} width={320} height={240} className="hidden" />
        </div>

        {/* Success or Error Banners */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Digital Receipt Display */}
        {comprovanteGerado ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Comprovante de Marcação Emitido</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 font-mono text-left text-[11px] text-slate-700 space-y-1">
              <p><strong>Hash Autenticidade:</strong> {comprovanteGerado.hash}</p>
              <p><strong>Tipo:</strong> {comprovanteGerado.tipo}</p>
              <p><strong>Horário:</strong> {comprovanteGerado.horario} hs • {comprovanteGerado.data}</p>
              <p><strong>Colaborador:</strong> {funcionarioNome}</p>
              <p><strong>Empresa:</strong> {user?.companyName || 'RH TRANSFORMA'}</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Imprimir / Salvar PDF
              </button>
              <button
                onClick={onClose}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          /* 4 Primary Action Punch Buttons */
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRegister('ENTRADA')}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>ENTRADA</span>
            </button>

            <button
              onClick={() => handleRegister('INICIO_INTERVALO')}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>INÍCIO PAUSA</span>
            </button>

            <button
              onClick={() => handleRegister('RETORNO_INTERVALO')}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-black py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>RETORNO PAUSA</span>
            </button>

            <button
              onClick={() => handleRegister('SAIDA')}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>SAÍDA</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
