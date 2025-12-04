import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Toaster, toast } from 'sonner'

// --- ICONOS ---
const IconHome = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
)
const IconUsers = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
)
const IconChecklist = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
)
const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
)

// --- LOGIN ---
function LoginScreen() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    let emailFinal = usuario.trim().toLowerCase()
    if (!emailFinal.includes('@')) emailFinal = `${emailFinal}@dojo.com`
    const { error } = await supabase.auth.signInWithPassword({ email: emailFinal, password })
    if (error) toast.error("Credenciales incorrectas")
    else toast.success("¡Bienvenido al Dojo!")
    setLoading(false)
  }

  const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', margin: 0, position: 'fixed', top: 0, left: 0, width: '100%' },
    card: { background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '90%', maxWidth: '350px', textAlign: 'center', boxSizing: 'border-box' },
    input: { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing:'border-box', fontSize: '16px' },
    btn: { width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop:'10px' }
  }

  return (
    <div style={styles.container}>
      <Toaster richColors position="top-center" />
      <div style={styles.card}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🥋</div>
        <h1 style={{ fontSize: '24px', color: '#1e293b', margin: '0 0 20px 0' }}>DojoPay</h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Usuario" value={usuario} onChange={e => setUsuario(e.target.value)} style={styles.input} autoCapitalize="none" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
          <button type="submit" disabled={loading} style={styles.btn}>{loading ? 'Entrando...' : 'INICIAR SESIÓN'}</button>
        </form>
      </div>
    </div>
  )
}

// --- DASHBOARD ---
function Dashboard({ session, rolUsuario }) {
  const [vistaActual, setVistaActual] = useState('inicio')
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState({ totalDeuda: 0, totalAlumnos: 0, ingresosMes: 0, asistenciaHoy: 0 })
  const [datosGrafica, setDatosGrafica] = useState([])
  const [historial, setHistorial] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAsistencia, setBusquedaAsistencia] = useState('')
  
  const [filtroMes, setFiltroMes] = useState('') // Formato "YYYY-MM"
  const [seleccionados, setSeleccionados] = useState([])

  // Estados Formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [idEdicion, setIdEdicion] = useState(null)
  
  // CAMPOS NUEVOS
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cinta, setCinta] = useState('Blanca')
  const [monto, setMonto] = useState(600)
  const [edad, setEdad] = useState('')
  const [tutor, setTutor] = useState('')
  const [emergencia, setEmergencia] = useState('')
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)

  useEffect(() => { fetchDatos() }, [filtroMes])

  async function fetchDatos() {
    setLoading(true)
    try {
      const { data: alumnosData } = await supabase.from('alumnos').select('*').eq('activo', true).order('nombre')
      
      let fechaInicio, fechaFin, modoDiario = false;
      if (filtroMes) {
        const [year, month] = filtroMes.split('-')
        fechaInicio = new Date(year, month - 1, 1).toISOString()
        fechaFin = new Date(year, month, 0, 23, 59, 59).toISOString()
        modoDiario = true;
      } else {
        const hoy = new Date()
        fechaFin = hoy.toISOString()
        const seisMesesAtras = new Date()
        seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5)
        seisMesesAtras.setDate(1)
        fechaInicio = seisMesesAtras.toISOString()
      }

      const { data: pagosRaw } = await supabase.from('pagos')
        .select('id, monto, alumno_id, fecha_pago, registrado_por')
        .gte('fecha_pago', fechaInicio)
        .lte('fecha_pago', fechaFin)
      
      let deuda = 0, ingresosPeriodo = 0
      pagosRaw.forEach(p => ingresosPeriodo += p.monto)

      const primerDiaMesActual = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { data: pagosEsteMesReal } = await supabase.from('pagos').select('alumno_id, monto').gte('fecha_pago', primerDiaMesActual)
      
      const alumnosProcesados = alumnosData.map(alumno => {
        const yaPago = pagosEsteMesReal.some(pago => pago.alumno_id === alumno.id)
        if (!yaPago) deuda += alumno.monto_mensualidad
        return { ...alumno, pagado: yaPago }
      })

      const fechaHoySQL = new Date().toISOString().split('T')[0]
      const { count: conteoAsistencia } = await supabase.from('asistencias').select('*', { count: 'exact', head: true }).eq('fecha', fechaHoySQL)

      setAlumnos(alumnosProcesados)
      setMetricas({ totalAlumnos: alumnosData.length, totalDeuda: deuda, ingresosMes: ingresosPeriodo, asistenciaHoy: conteoAsistencia || 0 })
      
      const ultimosPagos = [...pagosRaw]
        .sort((a,b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
        .slice(0, 10)
        .map(p => {
          const alum = alumnosData.find(a => a.id === p.alumno_id)
          return { ...p, nombre_alumno: alum ? alum.nombre : 'Alumno Eliminado' }
        })
      setHistorial(ultimosPagos)

      // GRÁFICA CON NOMBRES EN ESPAÑOL
      let dataFinal = []
      if (modoDiario) {
        const diasDelMes = new Date(filtroMes.split('-')[0], filtroMes.split('-')[1], 0).getDate();
        const mapaDias = {}
        for(let i=1; i<=diasDelMes; i++) mapaDias[i] = 0;
        pagosRaw.forEach(p => {
          const dia = new Date(p.fecha_pago).getDate()
          if (mapaDias[dia] !== undefined) mapaDias[dia] += p.monto
        })
        dataFinal = Object.keys(mapaDias).map(d => ({ name: d, total: mapaDias[d] }))
      } else {
        const mapaMeses = {}
        for (let i = 5; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          // FORZAR ESPAÑOL MEXICO
          const nombreMes = d.toLocaleString('es-MX', { month: 'short' }).toUpperCase().replace('.', '')
          mapaMeses[nombreMes] = 0
        }
        pagosRaw.forEach(p => {
          const key = new Date(p.fecha_pago).toLocaleString('es-MX', { month: 'short' }).toUpperCase().replace('.', '')
          if (mapaMeses[key] !== undefined) mapaMeses[key] += p.monto
        })
        dataFinal = Object.keys(mapaMeses).map(key => ({ name: key, total: mapaMeses[key] }))
      }
      setDatosGrafica(dataFinal)

    } catch (error) { toast.error('Error cargando datos') } 
    finally { setLoading(false) }
  }

  async function subirFoto() {
    if (!archivoFoto) return null
    const ext = archivoFoto.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, archivoFoto)
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  function toggleSeleccion(id) {
    if (seleccionados.includes(id)) setSeleccionados(seleccionados.filter(sid => sid !== id))
    else setSeleccionados([...seleccionados, id])
  }
  
  function seleccionarTodosFiltrados() {
    const idsVisibles = alumnosFiltradosAsistencia.map(a => a.id)
    const yaEstanTodos = idsVisibles.every(id => seleccionados.includes(id))
    if (yaEstanTodos) setSeleccionados(seleccionados.filter(id => !idsVisibles.includes(id)))
    else { const nuevos = idsVisibles.filter(id => !seleccionados.includes(id)); setSeleccionados([...seleccionados, ...nuevos]) }
  }

  async function guardarAsistencia() {
    if (seleccionados.length === 0) return toast.warning("Selecciona al menos un alumno")
    const inserts = seleccionados.map(id => ({ alumno_id: id }))
    const { error } = await supabase.from('asistencias').insert(inserts)
    if (error) toast.error("Error al guardar")
    else { toast.success(`${seleccionados.length} asistencias guardadas`); setSeleccionados([]); fetchDatos() }
  }

  function confirmarPago(id, monto) {
    toast(`¿Cobrar $${monto}?`, {
      action: {
        label: "CONFIRMAR",
        onClick: async () => {
          const { error } = await supabase.from('pagos').insert([{
            alumno_id: id, 
            monto: monto,
            registrado_por: session.user.email 
          }])
          if (!error) { fetchDatos(); toast.success(`Pago registrado`) }
        }
      }
    })
  }

  async function borrarPago(pagoId) {
    toast("¿Borrar este pago?", {
      description: "Esta acción restará el dinero.",
      action: {
        label: "BORRAR",
        onClick: async () => {
          const { error } = await supabase.from('pagos').delete().eq('id', pagoId)
          if (!error) { fetchDatos(); toast.success("Pago eliminado") }
          else toast.error("Error al borrar")
        }
      }
    })
  }

  // --- CRUD CON CAMPOS NUEVOS ---
  function abrirFormularioCrear() { 
    setModoEdicion(false); setNombre(''); setTelefono(''); setCinta('Blanca'); setMonto(600); 
    setEdad(''); setTutor(''); setEmergencia(''); 
    setArchivoFoto(null); setFotoPreview(null); setMostrarFormulario(true) 
  }
  
  function abrirFormularioEditar(a) { 
    setModoEdicion(true); setIdEdicion(a.id); setNombre(a.nombre); setTelefono(a.telefono||''); setCinta(a.cinta); setMonto(a.monto_mensualidad); 
    setEdad(a.edad || ''); setTutor(a.tutor || ''); setEmergencia(a.emergencia || '');
    setArchivoFoto(null); setFotoPreview(a.foto_url); setMostrarFormulario(true) 
  }

  async function guardarAlumno(e) {
    e.preventDefault()
    const guardarPromesa = async () => {
      let urlFinal = fotoPreview
      if (archivoFoto) urlFinal = await subirFoto()
      // AQUÍ GUARDAMOS LOS CAMPOS NUEVOS
      const datos = { 
        nombre, telefono, cinta, monto_mensualidad: monto, activo: true, foto_url: urlFinal,
        edad: edad || null,
        tutor: tutor || null,
        emergencia: emergencia || null
      }
      const { error } = modoEdicion ? await supabase.from('alumnos').update(datos).eq('id', idEdicion) : await supabase.from('alumnos').insert([datos])
      if (error) throw error
      setMostrarFormulario(false); fetchDatos()
    }
    toast.promise(guardarPromesa(), { loading: 'Guardando...', success: '¡Guardado!', error: 'Error' })
  }
  
  function enviarWhatsApp(tel, nom, monto) { 
    if(tel) window.open(`https://wa.me/${tel}?text=Hola ${nom}, tu pago vence hoy.`, '_blank')
    else toast.warning("Sin teléfono")
  }
  
  async function cerrarSesion() { 
    await supabase.auth.signOut()
    window.location.href = "/"
  }
  
  const getIniciales = (n) => n.split(' ').map(c=>c[0]).join('').substring(0,2).toUpperCase()
  const listaParaMostrar = vistaActual === 'inicio' ? alumnos.filter(a => !a.pagado) : alumnos.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  const alumnosFiltradosAsistencia = alumnos.filter(a => a.nombre.toLowerCase().includes(busquedaAsistencia.toLowerCase()))

  const MAX_WIDTH = '1000px';

  const styles = {
    globalWrapper: { minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', margin: 0, padding: 0, position: 'absolute', top: 0, left: 0, overflowX: 'hidden' },
    appCentered: { width: '100%', maxWidth: MAX_WIDTH, margin: '0 auto', background: '#f8fafc', minHeight: '100vh', position: 'relative' },
    topBar: { background: 'white', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' },
    content: { padding: '20px', paddingBottom: '100px', width: '100%', boxSizing: 'border-box' },
    bottomBarContainer: { position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 100, display: 'flex', justifyContent: 'center', pointerEvents: 'none' },
    bottomBarInner: { width: '100%', maxWidth: MAX_WIDTH, background: 'white', borderTop: '1px solid #e2e8f0', padding: '12px 0', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)', pointerEvents: 'auto' },
    statContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' },
    statBox: { background: 'white', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    card: { background: 'white', borderRadius: '16px', padding: '15px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #f1f5f9' },
    avatar: { width: '48px', height: '48px', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0, objectFit: 'cover' },
    search: { width: '100%', padding: '16px', marginBottom: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box' },
    chartContainer: { background: 'white', padding: '15px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #f1f5f9', height: '300px', width: '100%', boxSizing: 'border-box' },
    btnFloatWrapper: { position: 'fixed', bottom: '90px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 },
    btnFloatInner: { width: '100%', maxWidth: MAX_WIDTH, display: 'flex', justifyContent: 'flex-end', paddingRight: '20px', boxSizing: 'border-box' },
    btnFloat: { background:'#3b82f6', color:'white', width:'56px', height:'56px', borderRadius:'50%', border:'none', fontSize:'24px', boxShadow:'0 4px 12px rgba(59,130,246,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents: 'auto' },
    navItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', background:'none', border:'none', fontSize:'10px', fontWeight:'600', cursor:'pointer' },
    fileInput: { marginBottom: '15px', fontSize: '12px', width: '100%' },
    histItem: { padding: '12px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' },
    btnDel: { background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' },
    listRow: { display:'flex', alignItems:'center', padding:'12px', borderBottom:'1px solid #f1f5f9', background:'white', cursor:'pointer' },
    checkbox: { width:'20px', height:'20px', borderRadius:'6px', border:'2px solid #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', marginRight:'15px', transition:'all 0.2s' },
    checked: { background:'#3b82f6', borderColor:'#3b82f6' },
    filterInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#1e293b' },
    // ESTILOS NUEVOS PARA INPUTS AGRUPADOS
    formGroup: { display:'flex', gap:'10px', marginBottom: '8px' },
    input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom:'8px' },
    label: { fontSize:'12px', color:'#64748b', fontWeight:'bold', marginBottom:'4px', display:'block' }
  }

  const titulos = { inicio: 'Resumen', asistencia: 'Pasar Lista', alumnos: 'Directorio' }

  return (
    <div style={styles.globalWrapper}>
      <div style={styles.appCentered}>
        <Toaster richColors position="top-center" />
        <div style={styles.topBar}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>{titulos[vistaActual]}</div>
          <button onClick={cerrarSesion} style={{ background: '#fee2e2', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#ef4444', fontWeight:'bold', fontSize:'12px' }}>
            <IconLogout /> SALIR
          </button>
        </div>

        <div style={styles.content}>
          {vistaActual === 'inicio' && (
            <>
              {rolUsuario === 'admin' && (
                <>
                  <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'15px', alignItems:'center', gap:'10px'}}>
                    <span style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>Periodo:</span>
                    <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} style={styles.filterInput} />
                    {filtroMes && <button onClick={()=>setFiltroMes('')} style={{fontSize:'12px', border:'none', background:'none', color:'#ef4444', cursor:'pointer'}}>Borrar</button>}
                  </div>

                  <div style={styles.statContainer}>
                    <div style={styles.statBox}><div style={{fontSize:'20px', fontWeight:'800', color:'#ef4444'}}>${metricas.totalDeuda}</div><div style={{fontSize:'10px', color:'#94a3b8', fontWeight:'700'}}>DEUDA</div></div>
                    <div style={styles.statBox}><div style={{fontSize:'20px', fontWeight:'800', color:'#10b981'}}>${metricas.ingresosMes}</div><div style={{fontSize:'10px', color:'#94a3b8', fontWeight:'700'}}>{filtroMes ? 'TOTAL MES' : 'MES ACTUAL'}</div></div>
                    <div style={styles.statBox}><div style={{fontSize:'20px', fontWeight:'800', color:'#3b82f6'}}>{metricas.asistenciaHoy}</div><div style={{fontSize:'10px', color:'#94a3b8', fontWeight:'700'}}>ASIST. HOY</div></div>
                  </div>
                  
                  <div style={styles.chartContainer}>
                    <h4 style={{margin:'0 0 10px 0', fontSize:'12px', color:'#64748b', textAlign:'center'}}>
                      {filtroMes ? `INGRESOS DIARIOS: ${filtroMes}` : 'TENDENCIA ÚLTIMOS 6 MESES'}
                    </h4>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={datosGrafica} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={0} />
                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${v}`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={filtroMes ? 10 : 30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{background:'white', padding:'20px', borderRadius:'16px', marginBottom:'25px'}}>
                    <h4 style={{margin:'0 0 15px 0', fontSize:'14px', color:'#64748b'}}>ÚLTIMOS PAGOS</h4>
                    {historial.map(p => (
                      <div key={p.id} style={styles.histItem}>
                        <div>
                          <div style={{fontWeight:'600', color:'#1e293b'}}>{p.nombre_alumno}</div>
                          <div style={{fontSize:'11px', color:'#94a3b8'}}>{new Date(p.fecha_pago).toLocaleDateString('es-MX')} • {p.registrado_por ? p.registrado_por.split('@')[0] : 'Sistema'}</div>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                          <div style={{color:'#10b981', fontWeight:'700'}}>+${p.monto}</div>
                          <button onClick={() => borrarPago(p.id)} style={styles.btnDel}><IconTrash /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>Pendientes ({listaParaMostrar.length})</h3>
              {listaParaMostrar.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}><div style={{fontSize:'40px'}}>🎉</div><p>¡Todo el mundo está al día!</p></div>
              ) : (
                listaParaMostrar.map((a) => (
                  <div key={a.id} style={{...styles.card, borderLeft: '4px solid #ef4444'}}>
                    {a.foto_url ? <img src={a.foto_url} style={{...styles.avatar, background:'transparent'}} /> : <div style={{...styles.avatar, background:'#ef4444'}}>{getIniciales(a.nombre)}</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{a.nombre}</div>
                      <div style={{fontSize:'12px', color:'#64748b'}}>Pago pendiente: ${a.monto_mensualidad}</div>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button onClick={() => confirmarPago(a.id, a.monto_mensualidad)} style={{background:'#eff6ff', color:'#3b82f6', border:'none', padding:'8px 12px', borderRadius:'8px', fontWeight:'700', fontSize:'12px'}}>COBRAR</button>
                      <button onClick={() => enviarWhatsApp(a.telefono, a.nombre, a.monto_mensualidad)} style={{background:'#f0fdf4', color:'#16a34a', border:'none', padding:'8px', borderRadius:'8px'}}>💬</button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {vistaActual === 'asistencia' && (
            <>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h3 style={{margin:0, fontSize:'16px'}}>Pasar Lista</h3>
                <div style={{background:'#eff6ff', color:'#3b82f6', padding:'5px 10px', borderRadius:'8px', fontSize:'12px', fontWeight:'bold'}}>{new Date().toLocaleDateString('es-MX', {weekday:'long', day:'numeric', month:'long'})}</div>
              </div>

              <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                <input placeholder="Buscar para asistencia..." value={busquedaAsistencia} onChange={(e) => setBusquedaAsistencia(e.target.value)} style={{...styles.search, marginBottom:0}} />
                <button onClick={seleccionarTodosFiltrados} style={{whiteSpace:'nowrap', background:'white', border:'1px solid #cbd5e1', borderRadius:'12px', padding:'0 15px', fontWeight:'bold', fontSize:'12px', color:'#64748b'}}>Todo</button>
              </div>

              <div style={{background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)', marginBottom:'80px'}}>
                {alumnosFiltradosAsistencia.map(a => {
                  const isSelected = seleccionados.includes(a.id)
                  return (
                    <div key={a.id} onClick={() => toggleSeleccion(a.id)} style={styles.listRow}>
                      <div style={{...styles.checkbox, ...(isSelected ? styles.checked : {})}}>
                        {isSelected && <IconCheck />}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:'600', color: isSelected ? '#3b82f6' : '#333'}}>{a.nombre}</div>
                        <div style={{fontSize:'11px', color:'#94a3b8'}}>{a.cinta}</div>
                      </div>
                      {a.foto_url && <img src={a.foto_url} style={{width:'32px', height:'32px', borderRadius:'50%', objectFit:'cover'}} />}
                    </div>
                  )
                })}
              </div>

              <div style={styles.btnFloatWrapper}>
                <div style={styles.btnFloatInner}>
                  <button onClick={guardarAsistencia} style={{...styles.btnFloat, width:'auto', padding:'0 20px', borderRadius:'30px', fontSize:'14px', fontWeight:'bold'}}>
                    GUARDAR ({seleccionados.length})
                  </button>
                </div>
              </div>
            </>
          )}

          {vistaActual === 'alumnos' && (
            <>
              <input placeholder="Buscar alumno..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.search} />
              {listaParaMostrar.map((a) => (
                <div key={a.id} style={styles.card} onClick={() => abrirFormularioEditar(a)}>
                  {a.foto_url ? <img src={a.foto_url} style={{...styles.avatar, background:'transparent'}} /> : <div style={{...styles.avatar, background: a.pagado ? '#10b981' : '#ef4444'}}>{getIniciales(a.nombre)}</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{a.nombre}</div>
                    <div style={{fontSize:'12px', color:'#64748b'}}>{a.cinta} • {a.pagado ? <span style={{color:'#10b981'}}>Al corriente</span> : <span style={{color:'#ef4444'}}>Pago pendiente</span>}</div>
                  </div>
                  <div style={{fontSize:'20px', color:'#cbd5e1'}}>›</div>
                </div>
              ))}
              <div style={styles.btnFloatWrapper}>
                <div style={styles.btnFloatInner}>
                  <button onClick={abrirFormularioCrear} style={styles.btnFloat}>+</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={styles.bottomBarContainer}>
          <div style={styles.bottomBarInner}>
            <button onClick={() => setVistaActual('inicio')} style={{...styles.navItem, color: vistaActual === 'inicio' ? '#3b82f6' : '#94a3b8'}}><IconHome active={vistaActual === 'inicio'} /> INICIO</button>
            <button onClick={() => setVistaActual('asistencia')} style={{...styles.navItem, color: vistaActual === 'asistencia' ? '#3b82f6' : '#94a3b8'}}><IconChecklist active={vistaActual === 'asistencia'} /> ASISTENCIA</button>
            <button onClick={() => setVistaActual('alumnos')} style={{...styles.navItem, color: vistaActual === 'alumnos' ? '#3b82f6' : '#94a3b8'}}><IconUsers active={vistaActual === 'alumnos'} /> ALUMNOS</button>
          </div>
        </div>

        {mostrarFormulario && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:200 }}>
            <div style={{ background:'white', padding:'25px', borderRadius:'16px', width:'90%', maxWidth:'400px', maxHeight:'90vh', overflowY:'auto' }}>
              <h2 style={{marginTop:0, fontSize:'18px', color:'#1e293b'}}>{modoEdicion?'Editar':'Nuevo'}</h2>
              <form onSubmit={guardarAlumno}>
                {/* FOTO */}
                <div style={{textAlign:'center', marginBottom:'15px'}}>
                  <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'#f1f5f9', margin:'0 auto 10px', display:'flex', justifyContent:'center', alignItems:'center', overflow:'hidden', border:'1px solid #e2e8f0'}}>
                    {fotoPreview || archivoFoto ? <img src={archivoFoto ? URL.createObjectURL(archivoFoto) : fotoPreview} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{fontSize:'30px'}}>📷</span>}
                  </div>
                  <input type="file" accept="image/*" onChange={e => setArchivoFoto(e.target.files[0])} style={{fontSize:'12px', width:'100%'}} />
                </div>

                {/* DATOS BÁSICOS */}
                <span style={styles.label}>DATOS PERSONALES</span>
                <input style={styles.input} placeholder="Nombre Completo" value={nombre} onChange={e=>setNombre(e.target.value)} required />
                <div style={styles.formGroup}>
                  <input style={{...styles.input, flex:1}} placeholder="Edad" value={edad} onChange={e=>setEdad(e.target.value)} type="number" />
                  <select style={{...styles.input, flex:1}} value={cinta} onChange={e=>setCinta(e.target.value)}>{['Blanca','Amarilla','Verde','Azul','Roja','Negra'].map(c=><option key={c}>{c}</option>)}</select>
                </div>

                {/* DATOS DE CONTACTO */}
                <span style={styles.label}><br/>CONTACTO Y PAGOS</span>
                <input style={styles.input} placeholder="Celular (WhatsApp)" value={telefono} onChange={e=>setTelefono(e.target.value)} type="number" />
                <input style={styles.input} placeholder="Monto Mensualidad ($)" value={monto} onChange={e=>setMonto(e.target.value)} type="number" />

                {/* DATOS DE EMERGENCIA (Condicional visualmente) */}
                {(edad && parseInt(edad) < 18) && <div style={{background:'#fff7ed', padding:'10px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #fed7aa', fontSize:'12px', color:'#ea580c'}}>⚠️ Es menor de edad. Ingresa tutor.</div>}
                
                <span style={styles.label}><br/>EMERGENCIA / TUTOR</span>
                <input style={styles.input} placeholder="Nombre Padre/Tutor" value={tutor} onChange={e=>setTutor(e.target.value)} />
                <input style={styles.input} placeholder="Teléfono de Emergencia" value={emergencia} onChange={e=>setEmergencia(e.target.value)} type="number" />

                <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                  <button type="button" onClick={()=>setMostrarFormulario(false)} style={{flex:1, padding:'12px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>CANCELAR</button>
                  <button type="submit" style={{flex:1, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>GUARDAR</button>
                </div>
                {modoEdicion && rolUsuario === 'admin' && <button type="button" onClick={() => {if(confirm("¿Baja?")) {supabase.from('alumnos').update({activo:false}).eq('id', idEdicion).then(() => {setMostrarFormulario(false);fetchDatos()})}}} style={{width:'100%', marginTop:'15px', background:'none', border:'none', color:'#ef4444', fontSize:'11px', cursor:'pointer'}}>ELIMINAR ALUMNO</button>}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) cargarPerfil(session.user.id); else setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) cargarPerfil(session.user.id); else { setRol(null); setLoading(false) } })
    return () => subscription.unsubscribe()
  }, [])
  async function cargarPerfil(uid) { const { data } = await supabase.from('perfiles').select('rol').eq('id', uid).single(); setRol(data?.rol || 'entrenador'); setLoading(false) }
  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', width:'100vw'}}>Cargando...</div>
  if (!session) return <LoginScreen />
  return <Dashboard session={session} rolUsuario={rol} />
}

export default App