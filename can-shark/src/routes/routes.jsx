
import Loadable from 'react-loadable';
import Loading from '../components/loading/Loading';

const HomeView  = Loadable({
  loader: () => import("../views/home/Home.jsx"),
  loading: Loading
});


const routes = [
  {
    path: "/home",
    sidebarName: "Home",
    //icon: InsertChartOutlined,
    component: HomeView,
  },

  { redirect: true, path: "/", to: "/home", navbarName: "Redirect" }
];

export default routes;
