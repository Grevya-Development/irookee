import{g as o,j as u}from"./index-C5TRQdPT.js";const y=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function k(r){const[g,n]=o.useState(null),[p,E]=o.useState([]),[h,t]=o.useState(!1),[m,s]=o.useState(null),i=async c=>{if(t(!0),s(null),!y.test(c)){n(null),s("Expert not found"),t(!1);return}try{const{data:e,error:a}=await u.from("speakers").select(`
          *,
          speaker_categories (
            category_id,
            categories ( id, name )
          )
        `).eq("id",c).single();if(a)throw a;const x=e.speaker_categories?e.speaker_categories.map(d=>{var l;return(l=d.categories)==null?void 0:l.name}).filter(Boolean):[];n({...e,categories:x})}catch(e){console.error("Error fetching expert:",e),s(e instanceof Error?e.message:"Failed to fetch expert")}finally{t(!1)}},f=async(c=50)=>{t(!0),s(null);try{const{data:e,error:a}=await u.from("speakers").select("*").eq("verification_status","verified").order("rating",{ascending:!1}).limit(c);if(a)throw a;E(e||[])}catch(e){console.error("Error fetching experts:",e),s(e instanceof Error?e.message:"Failed to fetch experts")}finally{t(!1)}};return o.useEffect(()=>{r?i(r):f()},[r]),{expert:g,experts:p,loading:h,error:m,refetch:r?()=>i(r):f}}export{k as u};
