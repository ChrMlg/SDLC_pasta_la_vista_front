export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#F7F8F5", minHeight: "100vh" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h1 style={{ color: "#173B2B", marginBottom: "8px" }}>Plataforma Restaurante</h1>
        <p style={{ color: "#66706B", marginBottom: "24px" }}>TESTEO DE ROLES </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a 
            href="/gerente/menu" 
            style={{ padding: "12px", background: "#173B2B", color: "white", textAlign: "center", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}
          >
            Rol Gerente
          </a>
          <a 
            href="/cliente/menu" 
            style={{ padding: "12px", background: "#B58742", color: "white", textAlign: "center", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}
          >
           Rol Cliente
          </a>
          <a 
            href="/mesero/menu" 
            style={{ padding: "12px", background: "#2C5282", color: "white", textAlign: "center", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}
          >
           Rol Mesero 
          </a>
          <a 
            href="/cocina/menu" 
            style={{ padding: "12px", background: "#9B2C2C", color: "white", textAlign: "center", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}
          >
           Rol Cocina 
          </a>
        </div>
      </div>
    </div>
  );
}