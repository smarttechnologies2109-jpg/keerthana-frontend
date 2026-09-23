import KeerthanaAI from "../components/KeerthanaAI";
import MusicPlayer from "../components/MusicPlayer";
import Sidebar from "../components/Sidebar";

const KeerthanaAIPage = () => {
  return (
    <div className="page-container">
      <Sidebar/>
      <KeerthanaAI />

    <MusicPlayer/>
    </div>
  );
};

export default KeerthanaAIPage;