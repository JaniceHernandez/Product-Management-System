/* export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600">
        HopePMS Setup Successful
      </h1>
    </div>
  )
} */
import { supabase } from './lib/supabaseClient';
supabase.auth.getSession().then(({ data, error }) => {

if (error) {

console.error('Supabase connection error:', error.message);

} else {

console.log('Supabase connected. Session:', data.session);

}

});


function App() {

return (

<div className="flex items-center justify-center min-h-screen bg-gray-100">

<h1 className="text-3xl font-bold text-blue-600">

Hope PMS — Supabase client ready

</h1>

</div>

)

}


export default App